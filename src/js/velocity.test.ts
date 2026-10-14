import assert from "node:assert/strict";
import { test } from "node:test";
import { createVelocity } from "./velocity.ts";

const near = (actual: number, expected: number) =>
  assert.ok(
    Math.abs(actual - expected) < expected * 0.05,
    `${actual} ≉ ${expected}`,
  );

void test("steady motion reads the same speed whether events are even or batched", () => {
  const even = createVelocity();
  for (let t = 0; t <= 400; t += 16) even.add(t, t * 1.3, 0); // 1300 px/s
  const batched = createVelocity();
  // pairs of events arriving together every 32 ms: the one from 16 ms ago and the latest
  for (let t = 0; t <= 400; t += 32) {
    batched.add(t, (t - 16) * 1.3, 0);
    batched.add(t, t * 1.3, 0);
  }
  near(even.at(400).x, 1300);
  near(batched.at(400).x, 1300);
});

void test("a stopped pointer reads zero", () => {
  const v = createVelocity();
  for (let t = 0; t <= 200; t += 16) v.add(t, t, 0);
  assert.equal(v.at(400).x, 0);
});

void test("two events a millisecond apart can't fake a huge speed", () => {
  const v = createVelocity();
  v.add(0, 0, 0);
  v.add(1, 21, 0);
  assert.equal(v.at(1).x, 0);
});
