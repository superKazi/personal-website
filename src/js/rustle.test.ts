import assert from "node:assert/strict";
import { test } from "node:test";
import { defaults } from "./config.ts";
import { createRustle, step } from "./rustle.ts";

// 100 columns spaced like the real word, all one cap height tall
const panels = Array.from({ length: 100 }, (_, i) => ({
  x: i * 0.04,
  y0: 0,
  y1: 1,
}));

// a pointer straight through the middle of every sheet
const ray = { y: 0.5, z: defaults.panels.depth / 2, slopeY: 0, slopeZ: 0 };

const run = (frameMs: number) => {
  const rustle = createRustle(panels);
  const dt = frameMs / 1000;
  // a fast swipe across the whole word, then let go
  const swipe = Math.max(1, Math.round(0.4 / dt));
  // the pointer's velocity, as GSAP Observer reports it
  const vx = 4 / (swipe * dt);
  for (let i = 0; i <= swipe; i++)
    step(rustle, { ...ray, x: (i / swipe) * 4, vx }, dt, defaults);
  const peak = Math.max(...rustle.angle.map(Math.abs));
  // six simulated seconds; steps are capped at 50 ms, so count frames, not wall time
  const settle = Math.ceil(6 / Math.min(dt, 0.05));
  for (let i = 0; i < settle; i++) step(rustle, null, dt, defaults);
  return { rustle, peak };
};

for (const frameMs of [8, 33, 5000]) {
  void test(`shipped defaults stay bounded and settle at ${frameMs} ms frames`, () => {
    const { rustle, peak } = run(frameMs);
    // after a very long frame the push is calm by design, so only real frame rates must move
    if (frameMs < 100)
      assert.ok(peak > 0.05, `a push should move Panels (peak ${peak})`);
    for (const a of rustle.angle) {
      assert.ok(Number.isFinite(a));
      assert.ok(Math.abs(a) <= defaults.rustle.maxAngle);
      assert.ok(Math.abs(a) < 1e-3, `should settle to rest (angle ${a})`);
    }
    assert.equal(rustle.moving, false);
  });
}

void test("Panels at rest stay at rest without a push", () => {
  const rustle = createRustle(panels);
  for (let i = 0; i < 100; i++) step(rustle, null, 0.016, defaults);
  assert.ok(rustle.angle.every((a) => a === 0));
});

void test("crossing a column reports it once", () => {
  const rustle = createRustle(panels);
  step(rustle, { ...ray, x: 0.01, vx: 2.5 }, 0.016, defaults);
  const crossed = step(rustle, { ...ray, x: 0.05, vx: 2.5 }, 0.016, defaults);
  assert.deepEqual(
    crossed.map((c) => c.column),
    [1],
  );
});
