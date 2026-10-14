import assert from "node:assert/strict";
import { test } from "node:test";
import { frequency, noteForLength, SCALES } from "./chime.ts";

void test("notes climb the scale and wrap into the next octave", () => {
  const root = 293.66; // D4
  const steps = SCALES.hirajoshi.length;
  assert.equal(frequency(0, root, "hirajoshi"), root);
  assert.ok(Math.abs(frequency(steps, root, "hirajoshi") - root * 2) < 1e-9);
  for (let n = 1; n < 12; n++)
    assert.ok(
      frequency(n, root, "hirajoshi") > frequency(n - 1, root, "hirajoshi"),
    );
});

void test("longer Panels ring lower, like real chimes", () => {
  // shortest Panel gets the highest note, longest the lowest
  assert.equal(noteForLength(0.2, 0.2, 1, 10), 9);
  assert.equal(noteForLength(1, 0.2, 1, 10), 0);
  assert.ok(noteForLength(0.4, 0.2, 1, 10) > noteForLength(0.8, 0.2, 1, 10));
  // all one length: everything plays the root instead of dividing by zero
  assert.equal(noteForLength(1, 1, 1, 10), 0);
});
