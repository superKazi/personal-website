import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { gsap } from "gsap";
import { config } from "./config.ts";
import { createPointer } from "./pointer.ts";
import { createRustle, step, type Crossing } from "./rustle.ts";

const panels = Array.from({ length: 100 }, (_, i) => ({
  x: i * 0.04,
  pieces: [{ y0: 0, y1: 1 }],
}));

// 100 screen px per cap height, straight through the middle of every Panel
const toWord = (x: number) => ({
  x: x / 100,
  y: 0.5,
  z: config.panels.depth / 2,
  slopeY: 0,
  slopeZ: 0,
});

const setup = (
  t: TestContext,
  velocity: readonly [number, number] = [0, 0],
) => {
  // GSAP runs unchanged; the test drives its clock frame by frame
  gsap.ticker.sleep();
  const button = Object.assign(new EventTarget(), { hidden: false });
  const pointer = createPointer({
    button: button as unknown as HTMLButtonElement,
    panels,
    toWord,
    velocity: () => velocity,
  });
  const rustle = createRustle(panels, config);
  /** One 60 FPS frame: GSAP updates its tweens first, as its ticker does, then Rustle reads the pointer. */
  const frame = (): Crossing[] => {
    gsap.updateRoot(gsap.globalTimeline.time() + 1 / 60);
    return step(rustle, pointer.now(), 1 / 60);
  };
  const click = () => button.dispatchEvent(new Event("click"));
  t.after(() => {
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
  });
  return { pointer, button, frame, click };
};

void test("a keyboard sweep crosses every Panel once, in order, and hands off to a resting pointer without a jump", (t) => {
  const { pointer, frame, click } = setup(t);
  // the mouse rests mid-word throughout
  pointer.track(200, 0);
  const crossed = [frame(), frame()];
  click();
  for (let i = 0; i < 120; i++) crossed.push(frame());
  assert.equal(pointer.now()?.source, "pointer");
  crossed.push(frame(), frame());
  assert.deepEqual(
    crossed.flat().map((c) => c.panel),
    panels.map((_, i) => i),
  );
});

void test("reduced motion stops a sweep, ignores the pointer and hides the button", (t) => {
  const { pointer, button, frame, click } = setup(t);
  click();
  frame();
  pointer.setReduced(true);
  assert.equal(pointer.now(), null);
  assert.equal(button.hidden, true);
  click();
  pointer.track(100, 0);
  assert.equal(pointer.now(), null);
  pointer.setReduced(false);
  assert.equal(button.hidden, false);
  // a stale sweep doesn't resume, and the pointer counts again once it moves
  assert.equal(pointer.now(), null);
  pointer.track(100, 0);
  assert.equal(pointer.now()?.source, "pointer");
});

void test("pointer velocity is projected onto the word", (t) => {
  const { pointer } = setup(t, [250, 0]);
  assert.equal(pointer.now(), null);
  pointer.track(100, 0);
  const now = pointer.now();
  assert.equal(now?.x, 1);
  assert.ok(Math.abs((now?.vx ?? 0) - 2.5) < 1e-9);
  pointer.leave();
  assert.equal(pointer.now(), null);
});
