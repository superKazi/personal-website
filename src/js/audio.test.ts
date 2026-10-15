import assert from "node:assert/strict";
import { test } from "node:test";
import { createAudio } from "./audio.ts";
import { defaults } from "./config.ts";
import { MATERIALS } from "./chime.ts";

void test("audio replaces repeated and oldest voices, and stays silent when off", async (t) => {
  const sources: { stops: number[] }[] = [];
  const param = () => ({
    value: 0,
    setValueAtTime: () => {},
    linearRampToValueAtTime: () => {},
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
    OscillatorNode: function () {
      const source = {
        ...node(),
        stops: [] as number[],
        start: () => {},
        stop: (time: number) => {
          source.stops.push(time);
        },
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
  const audio = createAudio();
  assert.equal(audio.chime(0, 300, 1, defaults), false);
  await audio.enable(defaults);
  const partials = MATERIALS[defaults.chime.material].ratios.length;
  for (let note = 0; note <= defaults.chime.voices; note++) {
    ctx.currentTime += 0.1;
    assert.equal(audio.chime(note, 300, 1, defaults), true);
  }
  assert.ok(sources.slice(0, partials).every((s) => s.stops.length === 2));
  assert.equal(
    sources.filter((s) => s.stops.length === 1).length,
    defaults.chime.voices * partials,
  );
  ctx.currentTime += 0.1;
  assert.equal(audio.chime(defaults.chime.voices, 300, 1, defaults), true);
  assert.ok(
    sources.slice(-partials * 2, -partials).every((s) => s.stops.length === 2),
  );
  assert.equal(
    sources.filter((s) => s.stops.length === 1).length,
    defaults.chime.voices * partials,
  );
  audio.disable();
  assert.equal(audio.chime(0, 300, 1, defaults), false);
});
