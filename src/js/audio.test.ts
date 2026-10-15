import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { createAudio } from "./audio.ts";
import { defaults } from "./config.ts";
import { MATERIALS } from "./chime.ts";
import { createRustle, step } from "./rustle.ts";

const setup = (t: TestContext) => {
  const sources: { frequency: number; starts: number[]; stops: number[] }[] =
    [];
  const ramps: number[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: (value: number) => ramps.push(value),
    setTargetAtTime: () => {},
    cancelScheduledValues: () => {},
  });
  const node = function () {
    return {
      gain: param(),
      connect: (destination: unknown) => destination,
    };
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 100,
    state: "suspended",
    destination: node(),
    createGain: node,
    createConvolver: node,
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
    resume: () => {
      ctx.state = "running";
      return Promise.resolve();
    },
    suspend: () => {
      ctx.state = "suspended";
      return Promise.resolve();
    },
  };
  const constructors = {
    AudioContext: function () {
      return ctx;
    },
    GainNode: node,
    WaveShaperNode: node,
    OscillatorNode: function (
      _context: unknown,
      options: Readonly<{ frequency: number }>,
    ) {
      const source = {
        ...node(),
        frequency: options.frequency,
        starts: [] as number[],
        stops: [] as number[],
        start: (time: number) => source.starts.push(time),
        stop: (time: number) => source.stops.push(time),
      };
      sources.push(source);
      return source;
    },
  };
  for (const [name, value] of Object.entries(constructors)) {
    const original = Object.getOwnPropertyDescriptor(globalThis, name);
    Object.defineProperty(globalThis, name, { value, configurable: true });
    t.after(() => {
      if (original) Object.defineProperty(globalThis, name, original);
      else Reflect.deleteProperty(globalThis, name);
    });
  }
  return { audio: createAudio(), ctx, sources, ramps };
};

void test("crossings choose Panel pitches, clamp strikes, and spread Chimes across a frame", async (t) => {
  const { audio, sources, ramps } = setup(t);
  const cfg = structuredClone(defaults);
  Object.assign(cfg.chime, {
    root: 440,
    scale: "majorPentatonic",
    notes: 5,
    detune: 0,
    minSpeed: 0,
    maxSpeed: 10,
  });
  audio.setLengths(new Float32Array([1, 0.75, 0.5]));
  const crossings = [
    { column: 0, speed: -1 },
    { column: 1, speed: 5 },
    { column: 2, speed: 20 },
  ];
  assert.deepEqual(audio.play(crossings, 0.06, cfg), []);
  await audio.enable(cfg);
  assert.deepEqual(audio.play(crossings, 0.06, cfg), [
    { strength: 0, pitch: 0 },
    { strength: 0.5, pitch: 0.5 },
    { strength: 1, pitch: 1 },
  ]);
  const fundamentals = sources.filter((_, i) => i % 3 === 0);
  for (const [i, start] of [0, 0.02, 0.04].entries())
    assert.ok(Math.abs(fundamentals[i].starts[0] - start) < 1e-9);
  for (const [i, hz] of [440, 554.3652619537442, 739.9888454232688].entries())
    assert.ok(Math.abs(fundamentals[i].frequency - hz) < 1e-9);
  for (const [i, gain] of [
    0.05, 0.058333333333333334, 0.06666666666666667,
  ].entries())
    assert.ok(Math.abs(ramps[i] - gain) < 1e-9);
});

void test("dense crossings return feedback only for admitted Chimes, including across frames", async (t) => {
  const { audio, ctx, sources } = setup(t);
  const cfg = structuredClone(defaults);
  cfg.chime.notes = 5;
  audio.setLengths(new Float32Array([1, 0.875, 0.75, 0.625, 0.5]));
  await audio.enable(cfg);
  const crossings = [0, 1, 2, 3, 4].map((column) => ({ column, speed: 10 }));
  assert.deepEqual(audio.play(crossings, 0.02, cfg), [
    { strength: 1, pitch: 0 },
    { strength: 1, pitch: 0.75 },
  ]);
  assert.equal(sources.length, 6);
  ctx.currentTime = 0.023;
  assert.deepEqual(audio.play(crossings.slice(0, 1), 0.016, cfg), []);
  ctx.currentTime = 0.024;
  assert.equal(audio.play(crossings.slice(0, 1), 0.016, cfg).length, 1);
  assert.deepEqual(audio.play([], 0.016, cfg), []);
});

void test("Rustle sweeps play in travel order, with longer Panels lower and octaves intact", async (t) => {
  const { audio, ctx, sources } = setup(t);
  const cfg = structuredClone(defaults);
  Object.assign(cfg.chime, { root: 440, notes: 6, detune: 0 });
  const rustle = createRustle(
    [1, 0.9, 0.8, 0.7, 0.6, 0.5].map((y1, i) => ({ x: i * 0.04, y0: 0, y1 })),
  );
  audio.setLengths(rustle.length);
  await audio.enable(cfg);
  const ray = { y: 0.25, z: 0.45, slopeY: 0, slopeZ: 0, vx: 10 };
  step(rustle, { ...ray, x: -0.01 }, 0.05, cfg);
  const forward = step(rustle, { ...ray, x: 0.21 }, 0.05, cfg);
  assert.equal(audio.play(forward, 0.12, cfg).length, 6);
  const fundamentals = () =>
    sources.filter((_, i) => i % 3 === 0).map((s) => s.frequency);
  const ascending = fundamentals();
  assert.equal(ascending[0], 440);
  assert.equal(ascending[5], 880);
  for (let i = 1; i < ascending.length; i++)
    assert.ok(ascending[i] > ascending[i - 1]);
  ctx.currentTime = 0.2;
  const reverse = step(rustle, { ...ray, x: -0.01, vx: -10 }, 0.05, cfg);
  assert.equal(audio.play(reverse, 0.12, cfg).length, 6);
  assert.deepEqual(fundamentals().slice(6), [...ascending].reverse());
  ctx.currentTime = 0.4;
  audio.setLengths(new Float32Array([0.75, 0.75]));
  assert.deepEqual(audio.play([{ column: 1, speed: 10 }], 0.016, cfg), [
    { strength: 1, pitch: 0 },
  ]);
  assert.equal(fundamentals().at(-1), 440);
});

void test("playback replaces repeated and oldest voices, and stays silent when off", async (t) => {
  const { audio, ctx, sources } = setup(t);
  const cfg = structuredClone(defaults);
  cfg.chime.voices = 3;
  cfg.chime.notes = 5;
  audio.setLengths(new Float32Array([1, 0.875, 0.75, 0.625, 0.5]));
  await audio.enable(cfg);
  assert.equal(
    audio.play(
      [0, 1, 2, 3].map((column) => ({ column, speed: 10 })),
      0.4,
      cfg,
    ).length,
    4,
  );
  const partials = MATERIALS[cfg.chime.material].ratios.length;
  assert.ok(sources.slice(0, partials).every((s) => s.stops.length === 2));
  assert.equal(
    sources.filter((s) => s.stops.length === 1).length,
    3 * partials,
  );
  ctx.currentTime = 0.5;
  assert.equal(audio.play([{ column: 3, speed: 10 }], 0.016, cfg).length, 1);
  assert.ok(
    sources.slice(-partials * 2, -partials).every((s) => s.stops.length === 2),
  );
  assert.equal(
    sources.filter((s) => s.stops.length === 1).length,
    3 * partials,
  );
  await audio.disable();
  assert.deepEqual(audio.play([{ column: 0, speed: 10 }], 0.016, cfg), []);
});

void test("an off request silences playback immediately and wins over an earlier pending resume", async (t) => {
  const { audio, ctx } = setup(t);
  audio.setLengths(new Float32Array([1]));
  // eslint-disable-next-line functional/no-let
  let finish = () => {};
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  t.mock.method(ctx, "resume", async () => {
    await pending;
    ctx.state = "running";
  });
  const starting = audio.enable(defaults);
  await audio.disable();
  // The hardware may still report running while suspension is in flight.
  ctx.state = "running";
  assert.deepEqual(audio.play([{ column: 0, speed: 10 }], 0.016, defaults), []);
  finish();
  await starting;
  assert.equal(ctx.state, "suspended");
});
