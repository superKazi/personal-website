import assert from "node:assert/strict";
import { setImmediate } from "node:timers/promises";
import { test, type TestContext } from "node:test";
import { gsap } from "gsap";
import { createSoundToggle } from "./toggle.ts";

// Native-element stand-in only; the Sound toggle and GSAP run unchanged.
const element = () => {
  const attributes = new Map<string, string>();
  return {
    textContent: "",
    className: "",
    attributes,
    append: () => {},
    setAttribute: (name: string, value: string) => attributes.set(name, value),
  };
};

const setup = (t: TestContext, change: (on: boolean) => Promise<void>) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const label = { textContent: "Turn on audio experience" };
  const svg = element();
  const adjacent: Readonly<ReturnType<typeof element>>[] = [];
  const button = Object.assign(new EventTarget(), {
    querySelector: (selector: string) => (selector === "svg" ? svg : label),
    after: (next: Readonly<ReturnType<typeof element>>) => adjacent.push(next),
    click: () => {
      button.dispatchEvent(new Event("click"));
    },
  });
  const original = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: { createElementNS: element, createElement: element },
  });
  const toggle = createSoundToggle(
    button as unknown as HTMLButtonElement,
    ["#ffffff"],
    change,
  );
  t.after(async () => {
    toggle.turnOff();
    await setImmediate();
    gsap.globalTimeline.clear();
    gsap.ticker.sleep();
    if (original) Object.defineProperty(globalThis, "document", original);
    else Reflect.deleteProperty(globalThis, "document");
  });
  return { button, toggle, label, status: () => adjacent[0] };
};

const pending = () => {
  const settle: { resolve: () => void; reject: (error: Error) => void } = {
    resolve: () => {},
    reject: () => {},
  };
  const promise = new Promise<void>((resolve, reject) => {
    settle.resolve = resolve;
    settle.reject = reject;
  });
  return { promise, ...settle };
};

void test("activation failure rolls the Sound toggle back and reports an accessible retry message", async (t) => {
  const errors = t.mock.method(console, "error", () => {});
  const { button, toggle, label, status } = setup(t, (on) =>
    on ? Promise.reject(new Error("resume blocked")) : Promise.resolve(),
  );
  button.click();
  assert.equal(toggle.isOn(), true);
  assert.equal(label.textContent, "Turn off audio experience");
  await setImmediate();
  assert.equal(toggle.isOn(), false);
  assert.equal(label.textContent, "Turn on audio experience");
  assert.equal(status().textContent, "Audio couldn’t start. Try again.");
  assert.equal(status().attributes.get("role"), "status");
  assert.equal(errors.mock.callCount(), 1);
});

void test("synchronous activation errors and rejected shutdown are both handled", async (t) => {
  const errors = t.mock.method(console, "error", () => {});
  const { button, toggle, status } = setup(t, (on) => {
    // eslint-disable-next-line functional/no-throw-statements -- simulate a failing AudioContext constructor
    if (on) throw new Error("AudioContext unavailable");
    return Promise.reject(new Error("close failed"));
  });
  button.click();
  await setImmediate();
  assert.equal(toggle.isOn(), false);
  assert.equal(status().textContent, "Audio couldn’t start. Try again.");
  assert.equal(errors.mock.callCount(), 2);
});

void test("an off request invalidates a pending activation without dispatching another click", async (t) => {
  const activation = pending();
  const change = t.mock.fn((on: boolean) =>
    on ? activation.promise : Promise.resolve(),
  );
  const { button, toggle, label, status } = setup(t, change);
  const clicks = t.mock.fn();
  button.addEventListener("click", clicks);
  button.click();
  assert.equal(
    change.mock.callCount(),
    1,
    "activation starts synchronously inside the click",
  );
  toggle.turnOff();
  activation.reject(new Error("older resume failed"));
  await setImmediate();
  assert.equal(toggle.isOn(), false);
  assert.equal(label.textContent, "Turn on audio experience");
  assert.equal(status().textContent, "");
  assert.equal(clicks.mock.callCount(), 1);
  assert.deepEqual(
    change.mock.calls.map((c) => c.arguments[0]),
    [true, false],
  );
});

void test("an older activation failure cannot undo a newer successful on request", async (t) => {
  const older = pending();
  const newer = pending();
  const attempts = [older, newer];
  const { button, toggle, label, status } = setup(t, (on) =>
    on ? (attempts.shift()?.promise ?? Promise.resolve()) : Promise.resolve(),
  );
  button.click();
  button.click();
  button.click();
  newer.resolve();
  await setImmediate();
  older.reject(new Error("stale activation"));
  await setImmediate();
  assert.equal(toggle.isOn(), true);
  assert.equal(label.textContent, "Turn off audio experience");
  assert.equal(status().textContent, "");
});

void test("failed activation can be retried and clears its status on the next request", async (t) => {
  t.mock.method(console, "error", () => {});
  const first = pending();
  const attempts = [first.promise, Promise.resolve()];
  const { button, toggle, status } = setup(t, (on) =>
    on ? (attempts.shift() ?? Promise.resolve()) : Promise.resolve(),
  );
  button.click();
  first.reject(new Error("try again"));
  await setImmediate();
  assert.notEqual(status().textContent, "");
  button.click();
  await setImmediate();
  assert.equal(toggle.isOn(), true);
  assert.equal(status().textContent, "");
});

void test("user clicks count sound-on and sound-off events", (t) => {
  const paths: string[] = [];
  Object.assign(globalThis, {
    goatcounter: {
      count: ({ path }: Readonly<{ path: string }>) => paths.push(path),
    },
  });
  t.after(() => Reflect.deleteProperty(globalThis, "goatcounter"));
  const { button } = setup(t, () => Promise.resolve());
  button.click();
  button.click();
  assert.deepEqual(paths, ["sound-on", "sound-off"]);
});

void test("the retry status clears after six seconds", async (t) => {
  t.mock.method(console, "error", () => {});
  const { button, status } = setup(t, (on) =>
    on ? Promise.reject(new Error("blocked")) : Promise.resolve(),
  );
  button.click();
  await setImmediate();
  gsap.ticker.sleep();
  assert.notEqual(status().textContent, "");
  t.mock.timers.tick(6000);
  assert.equal(status().textContent, "");
});
