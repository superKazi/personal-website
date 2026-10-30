import type { Config } from "./config.ts";
import type { Panel } from "./panels.ts";

/**
 * The pointer as a ray through word space (cap heights): a point on the word's
 * mid-depth plane, plus how y and z change per unit of x along the ray.
 */
export interface Pointer {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly slopeY: number;
  readonly slopeZ: number;
  /** velocity along the word, cap heights per second, from GSAP Observer */
  readonly vx: number;
  /** what drives it; a hand-off between the two jumps, so it crosses nothing */
  readonly source: "pointer" | "keyboard";
}

type PanelLike = Pick<Panel, "x" | "pieces">;

const MAX_DT = 0.05;
const SUBSTEP = 1 / 120;
const REST = 1e-4;

/** Rustle state, one entry per Panel; `panels` must be in order along the word. */
export const createRustle = (
  panels: readonly PanelLike[],
  { rustle: cfg, panels: { depth } }: Readonly<Config>,
) => ({
  panels,
  /** tilt toward +x, radians */
  angle: new Float32Array(panels.length),
  velocity: new Float32Array(panels.length),
  /** where the bend sits, 0 = Spine, 1 = free edge */
  bend: new Float32Array(panels.length).fill(0.5),
  /** how far each free edge moves sideways per radian of tilt, scratch for `contact` */
  lever: new Float32Array(panels.length),
  prev: null as Pointer | null,
  speed: 0,
  moving: false,
  cfg,
  depth,
});

export type Rustle = ReturnType<typeof createRustle>;

/** Where the pointer ray meets Panel `i`, as a fraction of depth from the Spine, or null if it misses. */
const hit = (
  r: Readonly<Rustle>,
  p: Pointer,
  i: number,
  margin: number,
  depth: number,
) => {
  const dx = r.panels[i].x - p.x;
  const y = p.y + p.slopeY * dx;
  const z = p.z + p.slopeZ * dx;
  // the keyboard sweep runs at one height, so it reaches every Panel, counters or not
  const inside =
    (p.source === "keyboard" ||
      r.panels[i].pieces.some((q) => y > q.y0 - margin && y < q.y1 + margin)) &&
    z > -margin &&
    z < depth + margin;
  return inside ? z / depth : null;
};

/** A Panel the pointer passed this step, with the pointer's speed along the word. */
export interface Crossing {
  readonly panel: number;
  readonly speed: number;
}

type Cfg = Readonly<Config["rustle"]>;

/** Panels the pointer reached and passed between the last event and this one. */
const crossed = (
  r: Readonly<Rustle>,
  prev: Pointer,
  pointer: Pointer,
  cfg: Cfg,
  depth: number,
): Crossing[] => {
  const dx = pointer.x - prev.x;
  if (dx === 0) return [];
  const crossings = r.panels.flatMap(({ x }, i) => {
    const t = (x - prev.x) / dx;
    if (t <= 0 || t > 1) return [];
    const ray = {
      ...pointer,
      x,
      y: prev.y + (pointer.y - prev.y) * t,
      z: prev.z + (pointer.z - prev.z) * t,
    };
    return hit(r, ray, i, cfg.margin, depth) !== null
      ? [{ panel: i, speed: Math.abs(r.speed) }]
      : [];
  });
  return dx > 0 ? crossings : crossings.reverse();
};

/** The pointer's push on Panel `i` for one substep; also slides the bend toward where it hit. */
const push = (
  // eslint-disable-next-line functional/prefer-immutable-types
  r: Rustle,
  pointer: Pointer,
  i: number,
  cfg: Cfg,
  depth: number,
  h: number,
) => {
  const at = hit(r, pointer, i, cfg.margin, depth);
  if (at === null) return 0;
  const d = (pointer.x - r.panels[i].x) / cfg.radius;
  const w = Math.exp(-d * d);
  if (w <= 1e-3) return 0;
  const target = Math.min(0.95, Math.max(0.1, at));
  r.bend[i] += (target - r.bend[i]) * (1 - Math.exp(-120 * w * h));
  return cfg.strength * r.speed * w;
};

/** Average share of the full tilt along a Panel's depth, matching the shader's bend `profile`. */
const reach = (h: number, cfg: Cfg) => {
  // eslint-disable-next-line functional/no-let
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const u = (i + 0.5) / 12;
    const t = Math.min(
      1,
      Math.max(0, (u - h + cfg.bendWidth) / (2 * cfg.bendWidth)),
    );
    sum += u + (t * t * (3 - 2 * t) - u) * cfg.bendSharpness;
  }
  return sum / 12;
};

// share of the spacing kept clear between free edges, so touching sheets never z-fight
const CLEARANCE = 0.1;

/**
 * Sheets can't pass through each other: where one's free edge would cross its neighbour's,
 * split the overlap between them and stop them closing, so a push carries down the row like
 * thumbing through records. Small-angle, free edge only; tilts stay under 0.25 rad.
 */
// eslint-disable-next-line functional/prefer-immutable-types
const contact = (r: Rustle, cfg: Cfg, depth: number) => {
  const n = r.panels.length;
  for (let i = 0; i < n; i++) r.lever[i] = depth * reach(r.bend[i], cfg);
  for (let pass = 0; pass < 4; pass++)
    for (let i = 0; i < n - 1; i++) {
      const l0 = r.lever[i];
      const l1 = r.lever[i + 1];
      const gap = (r.panels[i + 1].x - r.panels[i].x) * (1 - CLEARANCE);
      const over = r.angle[i] * l0 - r.angle[i + 1] * l1 - gap;
      if (over <= 0) continue;
      const k = 1 / (l0 * l0 + l1 * l1);
      r.angle[i] -= over * k * l0;
      r.angle[i + 1] += over * k * l1;
      // paper doesn't bounce: drop only the closing speed
      const closing = r.velocity[i] * l0 - r.velocity[i + 1] * l1;
      if (closing > 0) {
        r.velocity[i] -= closing * k * l0;
        r.velocity[i + 1] += closing * k * l1;
      }
    }
};

/** One substep of `h` seconds: springs, neighbour coupling and the pointer, then contact and the angle limit. */
const substep = (
  // eslint-disable-next-line functional/prefer-immutable-types
  r: Rustle,
  pointer: Pointer | null,
  cfg: Cfg,
  depth: number,
  h: number,
) => {
  const n = r.panels.length;
  for (let i = 0; i < n; i++) {
    const a = r.angle[i];
    const left = i > 0 ? r.angle[i - 1] : a;
    const right = i < n - 1 ? r.angle[i + 1] : a;
    const spring =
      -cfg.stiffness * a -
      cfg.damping * r.velocity[i] +
      cfg.coupling * (left + right - 2 * a);
    const pushed =
      pointer && cfg.radius > 0 ? push(r, pointer, i, cfg, depth, h) : 0;
    r.velocity[i] += (spring + pushed) * h;
  }
  for (let i = 0; i < n; i++) r.angle[i] += r.velocity[i] * h;
  contact(r, cfg, depth);
  for (let i = 0; i < n; i++) {
    const a = r.angle[i];
    const clamped = Math.max(-cfg.maxAngle, Math.min(cfg.maxAngle, a));
    // hitting the limit absorbs the motion instead of bouncing
    if (clamped !== a) r.velocity[i] = 0;
    r.angle[i] = clamped;
  }
};

/** Advance by `dt` seconds. Long frames are capped, then split into small substeps. */
export const step = (
  // simulation state is mutated in place every frame
  // eslint-disable-next-line functional/prefer-immutable-types
  r: Rustle,
  pointer: Pointer | null,
  dt: number,
): Crossing[] => {
  const { cfg, depth } = r;
  const frame = Math.min(Math.max(dt, 0), MAX_DT);

  // velocity comes with the pointer (GSAP Observer's), not from frame gaps, so uneven
  // events and long pauses can't fake a fast swipe
  const prev = r.prev;
  r.speed = pointer?.vx ?? 0;
  r.prev = pointer ? { ...pointer } : null;
  const crossings =
    pointer && prev?.source === pointer.source
      ? crossed(r, prev, pointer, cfg, depth)
      : [];

  const steps = Math.ceil(frame / SUBSTEP);
  const h = steps ? frame / steps : 0;
  for (let s = 0; s < steps; s++) substep(r, pointer, cfg, depth, h);

  const energy = Math.max(
    0,
    ...Array.from(r.angle, (a, i) =>
      Math.max(Math.abs(a), Math.abs(r.velocity[i])),
    ),
  );
  r.moving = energy > REST;
  if (!r.moving && !pointer) {
    r.angle.fill(0);
    r.velocity.fill(0);
  }
  return crossings;
};
