import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "./config.ts";
import { createRustle, step } from "./rustle.ts";

// 100 columns spaced like the real word, all one cap height tall
const panels = Array.from({ length: 100 }, (_, i) => ({
  x: i * 0.04,
  y0: 0,
  y1: 1,
}));

// a pointer straight through the middle of every sheet
const ray = { y: 0.5, z: config.panels.depth / 2, slopeY: 0, slopeZ: 0 };

const run = (frameMs: number) => {
  const rustle = createRustle(panels);
  const dt = frameMs / 1000;
  // a fast swipe across the whole word, then let go
  const swipe = Math.max(1, Math.round(0.4 / dt));
  // the pointer's velocity, as GSAP Observer reports it
  const vx = 4 / (swipe * dt);
  for (let i = 0; i <= swipe; i++)
    step(rustle, { ...ray, x: (i / swipe) * 4, vx }, dt, config);
  const peak = Math.max(...rustle.angle.map(Math.abs));
  // six simulated seconds; steps are capped at 50 ms, so count frames, not wall time
  const settle = Math.ceil(6 / Math.min(dt, 0.05));
  for (let i = 0; i < settle; i++) step(rustle, null, dt, config);
  return { rustle, peak };
};

for (const frameMs of [8, 33, 5000]) {
  void test(`shipped settings stay bounded and settle at ${frameMs} ms frames`, () => {
    const { rustle, peak } = run(frameMs);
    // after a very long frame the push is calm by design, so only real frame rates must move
    if (frameMs < 100)
      assert.ok(peak > 0.05, `a push should move Panels (peak ${peak})`);
    for (const a of rustle.angle) {
      assert.ok(Number.isFinite(a));
      assert.ok(Math.abs(a) <= config.rustle.maxAngle);
      assert.ok(Math.abs(a) < 1e-3, `should settle to rest (angle ${a})`);
    }
    assert.equal(rustle.moving, false);
  });
}

void test("Panels at rest stay at rest without a push", () => {
  const rustle = createRustle(panels);
  for (let i = 0; i < 100; i++) step(rustle, null, 0.016, config);
  assert.ok(rustle.angle.every((a) => a === 0));
});

void test("crossing a column reports it once", () => {
  const rustle = createRustle(panels);
  step(rustle, { ...ray, x: 0.01, vx: 2.5 }, 0.016, config);
  const crossed = step(rustle, { ...ray, x: 0.05, vx: 2.5 }, 0.016, config);
  assert.deepEqual(
    crossed.map((c) => c.column),
    [1],
  );
});

void test("the same timed swipe bends equally at 30, 60 and 120 FPS", () => {
  const peaks = [30, 60, 120].map((fps) => {
    const r = createRustle([{ x: 0, y0: 0, y1: 1 }]);
    const angles: number[] = [];
    for (let f = 0; f < fps * 2; f++) {
      step(r, { ...ray, x: -0.1 + (0.1 * f) / fps, vx: 0.1 }, 1 / fps, config);
      angles.push(Math.abs(r.angle[0]));
    }
    return Math.max(...angles);
  });
  assert.ok(Math.max(...peaks) / Math.min(...peaks) < 1.05);
});

void test("fast oblique sweeps report crossings in travel order", () => {
  for (const [from, to, expected] of [
    [-0.1, 0.6, [0, 1, 2]],
    [0.6, -0.1, [2, 1, 0]],
  ] as const) {
    const r = createRustle([0, 0.04, 0.08].map((x) => ({ x, y0: 0, y1: 1 })));
    const p = { ...ray, slopeZ: -1.428, vx: 10 };
    step(r, { ...p, x: from }, 0.05, config);
    assert.deepEqual(
      step(r, { ...p, x: to }, 0.05, config).map((c) => c.column),
      expected,
    );
  }
});

void test("holes between panel pieces neither bend nor chime", () => {
  const r = createRustle([
    { x: 0.04, y0: 0, y1: 0.2 },
    { x: 0.04, y0: 0.8, y1: 1 },
  ]);
  step(r, { ...ray, x: 0.03, vx: 2 }, 0.016, config);
  assert.deepEqual(step(r, { ...ray, x: 0.05, vx: 2 }, 0.016, config), []);
  assert.equal(r.angle[0], 0);
  assert.equal(r.moving, false);
});

void test("reused pointer objects retain the previous crossing position", () => {
  const r = createRustle(panels);
  const p = { ...ray, x: 0.01, vx: 2 };
  step(r, p, 0.016, config);
  p.x = 0.05;
  assert.deepEqual(
    step(r, p, 0.016, config).map((c) => c.column),
    [1],
  );
});

void test("reversing at a column does not count the same endpoint twice", () => {
  const r = createRustle(panels);
  const p = { ...ray, vx: 2 };
  step(r, { ...p, x: 0.03 }, 0.016, config);
  assert.equal(step(r, { ...p, x: 0.04 }, 0.016, config).length, 1);
  assert.equal(step(r, { ...p, x: 0.03 }, 0.016, config).length, 0);
});
