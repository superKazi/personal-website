import assert from "node:assert/strict";
import { test } from "node:test";
import { frequency, noteAt, SCALES } from "./chime.ts";

void test("notes climb the scale and wrap into the next octave", () => {
  const root = 293.66; // D4
  const yo = SCALES.yo;
  // first note is the root, and the scale's length lands an octave up
  assert.equal(frequency(0, root, "yo"), root);
  assert.ok(Math.abs(frequency(yo.length, root, "yo") - root * 2) < 1e-9);
  for (let n = 1; n < 12; n++)
    assert.ok(frequency(n, root, "yo") > frequency(n - 1, root, "yo"));
});

void test("position along the word maps to notes left to right, clamped", () => {
  assert.equal(noteAt(0, 0, 4, 12), 0);
  assert.equal(noteAt(4, 0, 4, 12), 11);
  assert.equal(noteAt(2, 0, 4, 12), 6);
  assert.equal(noteAt(-1, 0, 4, 12), 0);
  assert.equal(noteAt(9, 0, 4, 12), 11);
});
