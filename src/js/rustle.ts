import type { Config } from "./config.ts";

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
}

interface PanelLike {
  readonly x: number;
  readonly y0: number;
  readonly y1: number;
}

const MAX_DT = 0.05;
const SUBSTEP = 1 / 120;
const REST = 1e-4;

/**
 * Rustle state. Panels sharing an x form one column and move together,
 * so a letter's floating pieces stay aligned with its stem.
 */
export const createRustle = (panels: readonly PanelLike[]) => {
  const xs = [...new Set(panels.map((p) => p.x))].sort((a, b) => a - b);
  const index = new Map(xs.map((x, i) => [x, i]));
  const pieces: PanelLike[][] = xs.map(() => []);
  // how much paper a column holds, summed across its pieces; sets its Chime's pitch
  const length = new Float32Array(xs.length);
  panels.forEach((p) => {
    const i = index.get(p.x) ?? 0;
    pieces[i].push(p);
    length[i] += p.y1 - p.y0;
  });
  return {
    xs,
    pieces,
    length,
    /** column of each Panel */
    column: panels.map((p) => index.get(p.x) ?? 0),
    /** tilt toward +x, radians */
    angle: new Float32Array(xs.length),
    velocity: new Float32Array(xs.length),
    /** where the bend sits, 0 = Spine, 1 = free edge */
    bend: new Float32Array(xs.length).fill(0.5),
    prev: null as Pointer | null,
    speed: 0,
    moving: false,
  };
};

export type Rustle = ReturnType<typeof createRustle>;

/** Where the pointer ray meets a column's sheet, as a fraction of depth from the Spine, or null if it misses. */
const hit = (
  r: Readonly<Rustle>,
  p: Pointer,
  i: number,
  margin: number,
  depth: number,
) => {
  const dx = r.xs[i] - p.x;
  const y = p.y + p.slopeY * dx;
  const z = p.z + p.slopeZ * dx;
  const inside =
    r.pieces[i].some((p) => y > p.y0 - margin && y < p.y1 + margin) &&
    z > -margin &&
    z < depth + margin;
  return inside ? z / depth : null;
};

/** Columns the pointer passed this step, with the pointer's speed along the word. */
export interface Crossing {
  readonly column: number;
  readonly speed: number;
}

type Cfg = Readonly<Config["rustle"]>;

/** Columns the pointer reached and passed between the last event and this one. */
const crossed = (
  r: Readonly<Rustle>,
  prev: Pointer,
  pointer: Pointer,
  cfg: Cfg,
  depth: number,
): Crossing[] => {
  const dx = pointer.x - prev.x;
  if (dx === 0) return [];
  const crossings = r.xs.flatMap((x, i) => {
    const t = (x - prev.x) / dx;
    if (t <= 0 || t > 1) return [];
    const ray = {
      ...pointer,
      x,
      y: prev.y + (pointer.y - prev.y) * t,
      z: prev.z + (pointer.z - prev.z) * t,
    };
    return hit(r, ray, i, cfg.margin, depth) !== null
      ? [{ column: i, speed: Math.abs(r.speed) }]
      : [];
  });
  return dx > 0 ? crossings : crossings.reverse();
};

/** The pointer's push on column `i` for one substep; also slides the bend toward where it hit. */
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
  const d = (pointer.x - r.xs[i]) / cfg.radius;
  const w = Math.exp(-d * d);
  if (w <= 1e-3) return 0;
  const target = Math.min(0.95, Math.max(0.1, at));
  r.bend[i] += (target - r.bend[i]) * (1 - Math.exp(-120 * w * h));
  return cfg.strength * r.speed * w;
};

/** One substep of `h` seconds: springs, neighbour coupling and the pointer, then the angle limit. */
const substep = (
  // eslint-disable-next-line functional/prefer-immutable-types
  r: Rustle,
  pointer: Pointer | null,
  cfg: Cfg,
  depth: number,
  h: number,
) => {
  const n = r.xs.length;
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
  for (let i = 0; i < n; i++) {
    const a = r.angle[i] + r.velocity[i] * h;
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
  { rustle: cfg, panels: { depth } }: Readonly<Config>,
): Crossing[] => {
  const frame = Math.min(Math.max(dt, 0), MAX_DT);

  // velocity comes with the pointer (GSAP Observer's), not from frame gaps, so uneven
  // events and long pauses can't fake a fast swipe
  const prev = r.prev;
  r.speed = pointer?.vx ?? 0;
  r.prev = pointer ? { ...pointer } : null;
  const crossings =
    pointer && prev ? crossed(r, prev, pointer, cfg, depth) : [];

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
