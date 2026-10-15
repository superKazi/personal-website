import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { createAudio } from "./audio.ts";
import { config } from "./config.ts";
import { BAMBOO } from "./chime.ts";
import { createRustle, step } from "./rustle.ts";

const setup = (t: TestContext) => {
  const sources: { frequency: number; starts: number[]; stops: number[] }[] =
    [];
  const ramps: number[] = [];
  // every GainNode's starting value, and the first value it was scheduled to
  const gains: { initial: number; scheduled?: number }[] = [];
  const param = (initial = 1) => {
    const record: { initial: number; scheduled?: number } = { initial };
    return {
      record,
      value: initial,
      setValueAtTime: (value: number) => {
        record.scheduled ??= value;
      },
      linearRampToValueAtTime: (value: number) => ramps.push(value),
      setTargetAtTime: () => {},
      cancelScheduledValues: () => {},
    };
  };
  const node = function (
    _context?: unknown,
    options?: Readonly<{ gain?: number }>,
  ) {
    return {
      gain: param(options?.gain),
      connect: (destination: unknown) => destination,
    };
  };
  const ctx = {
    currentTime: 0,
    sampleRate: 100,
    state: "suspended",
    destination: node(),
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
    GainNode: function (
      _context: unknown,
      options?: Readonly<{ gain?: number }>,
    ) {
      const gain = node(_context, options);
      gains.push(gain.gain.record);
      return gain;
    },
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
  // every Chime adds exactly one source per partial, fundamental first
  const partials = BAMBOO.ratios.length;
  const fundamentals = () => sources.filter((_, i) => i % partials === 0);
  return { audio: createAudio(), ctx, sources, ramps, gains, fundamentals };
};

void test("crossings choose Panel pitches, clamp and smooth strikes, and spread Chimes across a frame", async (t) => {
  const { audio, ramps, fundamentals } = setup(t);
  const cfg = structuredClone(config);
  Object.assign(cfg.chime, {
    root: 440,
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
  // targets clamp to 0, 0.5 and 1; the strike follows them a quarter of the way per Chime
  assert.deepEqual(audio.play(crossings, 0.06, cfg), [
    { strength: 0, scalePosition: 0 },
    { strength: 0.125, scalePosition: 0.5 },
    { strength: 0.34375, scalePosition: 1 },
  ]);
  const played = fundamentals();
  // 30 ms ahead of the clock, so no Chime is scheduled in the past
  for (const [i, start] of [0.03, 0.05, 0.07].entries())
    assert.ok(Math.abs(played[i].starts[0] - start) < 1e-9);
  for (const [i, hz] of [440, 523.2511306011972, 698.4564628660078].entries())
    assert.ok(Math.abs(played[i].frequency - hz) < 1e-9);
  const { volume, voices, dynamics } = cfg.chime;
  for (const [i, s] of [0, 0.125, 0.34375].entries())
    assert.ok(
      Math.abs(ramps[i] - (volume / voices) * (1 - dynamics + dynamics * s)) <
        1e-9,
    );
});

void test("Chime gains start at their scheduled levels, so a late schedule can't play at full gain", async (t) => {
  const { audio, gains } = setup(t);
  const cfg = structuredClone(config);
  audio.setLengths(new Float32Array([1, 0.5]));
  await audio.enable(cfg);
  const before = gains.length;
  assert.equal(audio.play([{ column: 0, speed: 5 }], 0.016, cfg).length, 1);
  const chime = gains.slice(before);
  // envelope, then one per partial
  assert.equal(chime.length, BAMBOO.ratios.length + 1);
  assert.equal(chime[0].initial, 0);
  for (const g of chime) assert.equal(g.initial, g.scheduled);
});

void test("one spiked crossing in a steady swipe doesn't jump out", async (t) => {
  const { audio, ctx } = setup(t);
  const cfg = structuredClone(config);
  Object.assign(cfg.chime, { notes: 5, minSpeed: 0, maxSpeed: 10 });
  audio.setLengths(new Float32Array([1, 0.875, 0.75, 0.625, 0.5]));
  await audio.enable(cfg);
  const strengths = [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 40, 5].map((speed, i) => {
    ctx.currentTime = i * 0.05;
    return audio.play([{ column: i % 5, speed }], 0.016, cfg)[0].strength;
  });
  const steady = strengths[9];
  assert.ok(Math.abs(steady - 0.5) < 0.05);
  assert.ok(strengths[10] - steady < 0.15);
  assert.ok(strengths[11] < strengths[10]);
});

void test("dense crossings return feedback only for admitted Chimes, including across frames", async (t) => {
  const { audio, ctx, sources } = setup(t);
  const cfg = structuredClone(config);
  cfg.chime.notes = 5;
  audio.setLengths(new Float32Array([1, 0.875, 0.75, 0.625, 0.5]));
  await audio.enable(cfg);
  const crossings = [0, 1, 2, 3, 4].map((column) => ({ column, speed: 10 }));
  assert.deepEqual(
    // spread 4.2 ms apart: only the first and fourth clear the 12 ms gap
    audio.play(crossings, 0.021, cfg).map((f) => f.scalePosition),
    [0, 0.75],
  );
  assert.equal(sources.length, 6);
  ctx.currentTime = 0.024;
  assert.deepEqual(audio.play(crossings.slice(0, 1), 0.016, cfg), []);
  ctx.currentTime = 0.025;
  assert.equal(audio.play(crossings.slice(0, 1), 0.016, cfg).length, 1);
  assert.deepEqual(audio.play([], 0.016, cfg), []);
});

void test("Rustle sweeps play in travel order, with longer Panels lower and octaves intact", async (t) => {
  const { audio, ctx, fundamentals: played } = setup(t);
  const cfg = structuredClone(config);
  Object.assign(cfg.chime, { root: 440, notes: 6, detune: 0 });
  const rustle = createRustle(
    [1, 0.9, 0.8, 0.7, 0.6, 0.5].map((y1, i) => ({ x: i * 0.04, y0: 0, y1 })),
  );
  audio.setLengths(rustle.length);
  await audio.enable(cfg);
  const ray = {
    y: 0.25,
    z: 0.45,
    slopeY: 0,
    slopeZ: 0,
    vx: 10,
    source: "pointer" as const,
  };
  step(rustle, { ...ray, x: -0.01 }, 0.05, cfg);
  const forward = step(rustle, { ...ray, x: 0.21 }, 0.05, cfg);
  assert.equal(audio.play(forward, 0.12, cfg).length, 6);
  const fundamentals = () => played().map((s) => s.frequency);
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
  assert.deepEqual(
    audio
      .play([{ column: 1, speed: 10 }], 0.016, cfg)
      .map((f) => f.scalePosition),
    [0],
  );
  assert.equal(fundamentals().at(-1), 440);
});

void test("playback replaces repeated and oldest voices, and stays silent when off", async (t) => {
  const { audio, ctx, sources } = setup(t);
  const cfg = structuredClone(config);
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
  const partials = BAMBOO.ratios.length;
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
  const starting = audio.enable(config);
  await audio.disable();
  // The hardware may still report running while suspension is in flight.
  ctx.state = "running";
  assert.deepEqual(audio.play([{ column: 0, speed: 10 }], 0.016, config), []);
  finish();
  await starting;
  assert.equal(ctx.state, "suspended");
});
