/** How far back speed is measured, ms: long enough to span several batches of events. */
const WINDOW = 80;
/** Shortest history that gives a trustworthy speed, ms; less reads as zero instead of spiking. */
const MIN_SPAN = 16;

/**
 * Pointer velocity from event timestamps over a sliding window. Batched or
 * unevenly spaced events don't matter: it measures distance over time, not
 * the gap between the last two events.
 */
export const createVelocity = () => {
  type Sample = Readonly<{ t: number; x: number; y: number }>;
  const samples: Sample[] = [];

  /** Record a pointer position at time `t` (ms). */
  const add = (t: number, x: number, y: number) => {
    samples.push({ t, x, y });
    while (samples.length > 2 && samples[0].t < t - WINDOW * 2) samples.shift();
  };

  /** Velocity in px/s as of time `now` (ms); zero once the pointer has stopped. */
  const at = (now: number) => {
    const last = samples.at(-1);
    if (!last || now - last.t > WINDOW) return { x: 0, y: 0 };
    const recent = samples.filter((s) => s.t >= last.t - WINDOW);
    if (last.t - recent[0].t < MIN_SPAN) return { x: 0, y: 0 };
    // least-squares slope over every sample, so events sharing a timestamp average out
    const n = recent.length;
    const mean = (f: (s: Sample) => number) =>
      recent.reduce((sum, s) => sum + f(s), 0) / n;
    const mt = mean((s) => s.t);
    const mx = mean((s) => s.x);
    const my = mean((s) => s.y);
    const vt = mean((s) => (s.t - mt) ** 2);
    return {
      x: (mean((s) => (s.t - mt) * (s.x - mx)) / vt) * 1000,
      y: (mean((s) => (s.t - mt) * (s.y - my)) / vt) * 1000,
    };
  };

  const clear = () => void samples.splice(0);

  return { add, at, clear };
};
