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
  const top = new Float32Array(xs.length);
  const bottom = new Float32Array(xs.length).fill(Infinity);
  panels.forEach((p) => {
    const i = index.get(p.x) ?? 0;
    top[i] = Math.max(top[i], p.y1);
    bottom[i] = Math.min(bottom[i], p.y0);
  });
  return {
    xs,
    top,
    bottom,
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
    y > r.bottom[i] - margin &&
    y < r.top[i] + margin &&
    z > -margin &&
    z < depth + margin;
  return inside ? z / depth : null;
};

/** Columns the pointer passed this step, with the pointer's speed along the word. */
export interface Crossing {
  readonly column: number;
  readonly speed: number;
}

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
  const n = r.xs.length;
  const crossings: Crossing[] = [];

  // pointer velocity along the word, lightly smoothed against uneven events
  const prev = r.prev;
  // real dt, not the capped one, so a long pause (backgrounded tab) can't fake a fast swipe
  const raw = pointer && prev && dt > 0 ? (pointer.x - prev.x) / dt : 0;
  r.speed = pointer && prev ? r.speed * 0.4 + raw * 0.6 : 0;
  r.prev = pointer;

  if (pointer && prev) {
    const lo = Math.min(prev.x, pointer.x);
    const hi = Math.max(prev.x, pointer.x);
    for (let i = 0; i < n; i++) {
      const x = r.xs[i];
      const reach = hit(r, pointer, i, cfg.margin, depth) !== null;
      if (reach && x > lo && x <= hi)
        crossings.push({ column: i, speed: Math.abs(r.speed) });
    }
  }

  const steps = Math.ceil(frame / SUBSTEP);
  const h = steps ? frame / steps : 0;
  // eslint-disable-next-line functional/no-let
  let energy = 0;
  for (let s = 0; s < steps; s++) {
    for (let i = 0; i < n; i++) {
      const a = r.angle[i];
      const left = i > 0 ? r.angle[i - 1] : a;
      const right = i < n - 1 ? r.angle[i + 1] : a;
      // eslint-disable-next-line functional/no-let
      let accel =
        -cfg.stiffness * a -
        cfg.damping * r.velocity[i] +
        cfg.coupling * (left + right - 2 * a);

      if (pointer && cfg.radius > 0) {
        const at = hit(r, pointer, i, cfg.margin, depth);
        const d = (pointer.x - r.xs[i]) / cfg.radius;
        const w = at === null ? 0 : Math.exp(-d * d);
        if (at !== null && w > 1e-3) {
          accel += (cfg.strength * r.speed * w) / h / steps;
          const target = Math.min(0.95, Math.max(0.1, at));
          r.bend[i] += (target - r.bend[i]) * Math.min(1, w);
        }
      }
      r.velocity[i] += accel * h;
    }
    for (let i = 0; i < n; i++) {
      const a = r.angle[i] + r.velocity[i] * h;
      const clamped = Math.max(-cfg.maxAngle, Math.min(cfg.maxAngle, a));
      // hitting the limit absorbs the motion instead of bouncing
      if (clamped !== a) r.velocity[i] = 0;
      r.angle[i] = clamped;
    }
  }
  for (let i = 0; i < n; i++)
    energy = Math.max(energy, Math.abs(r.angle[i]), Math.abs(r.velocity[i]));

  r.moving = energy > REST;
  if (!r.moving && !pointer) {
    r.angle.fill(0);
    r.velocity.fill(0);
  }
  return crossings;
};
