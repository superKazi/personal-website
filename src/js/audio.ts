import { frequency, MATERIALS, noteForLength } from "./chime.ts";
import type { Config } from "./config.ts";
import type { Crossing } from "./rustle.ts";

interface Voice {
  readonly note: number;
  readonly gain: GainNode;
  readonly sources: readonly AudioScheduledSourceNode[];
  readonly end: number;
}

/**
 * The page's one AudioContext. Browsers only let audio start inside a user
 * gesture, so `enable` must be called from the Sound toggle's press.
 * Respects the iOS silent switch: we never override the audio session type.
 */
export const createAudio = () => {
  // eslint-disable-next-line functional/no-let
  let ctx: AudioContext | undefined;
  // eslint-disable-next-line functional/no-let
  let enabled = false;
  // eslint-disable-next-line functional/no-let
  let dry: GainNode | undefined;
  // eslint-disable-next-line functional/no-let
  let wet: GainNode | undefined;
  /** ringing voices, oldest first */
  const voices: Voice[] = [];
  // eslint-disable-next-line functional/no-let
  let lastStart = -Infinity;
  // closer than this, separate Chimes blur together anyway; skipping them keeps the audio thread light
  const MIN_GAP = 0.012;
  // Firefox's clock runs in coarse steps, so "now" can already be past on the audio thread;
  // a Chime scheduled there skips its attack and clicks, and dense clicks buzz
  const LOOKAHEAD = 0.03;
  // eslint-disable-next-line functional/no-let
  let strike = 0;
  const lengths = { values: [] as readonly number[], min: 0, max: 0 };

  const setLengths = (values: Readonly<Float32Array>) => {
    lengths.values = Array.from(values);
    lengths.min = Math.min(...values);
    lengths.max = Math.max(...values);
  };

  /** A soft room: decaying stereo noise as a reverb impulse, no audio files. */
  const room = (c: AudioContext, seconds: number) => {
    const length = Math.floor(c.sampleRate * seconds);
    const impulse = c.createBuffer(2, length, c.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = impulse.getChannelData(ch);
      for (let i = 0; i < length; i++)
        data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    }
    const reverb = c.createConvolver();
    reverb.buffer = impulse;
    return reverb;
  };

  /**
   * Rounds peaks off smoothly (tanh) instead of chopping them, so the output can
   * never crackle past full scale. A WaveShaper clamps its input to ±1, so the
   * signal is halved first: quiet sound passes unchanged, overs up to 2× stay smooth.
   */
  const softClip = (c: AudioContext) => {
    const curve = new Float32Array(2048);
    for (let i = 0; i < curve.length; i++)
      curve[i] = Math.tanh(((i / (curve.length - 1)) * 2 - 1) * 2);
    const input = new GainNode(c, { gain: 0.5 });
    const output = new WaveShaperNode(c, { curve, oversample: "2x" });
    input.connect(output);
    return { input, output };
  };

  /** Fade a voice out fast and stop its sources, freeing it for a new note. */
  const silence = (v: Voice, t: number) => {
    v.gain.gain.cancelScheduledValues(t);
    v.gain.gain.setTargetAtTime(0, t, 0.01);
    v.sources.forEach((s) => {
      try {
        s.stop(t + 0.05);
      } catch {
        // already stopped
      }
    });
  };

  /** Drop voices that have finished, then make room: the same note, or else the oldest, gives way. */
  const makeRoom = (note: number, t: number, now: number, max: number) => {
    for (let i = voices.length - 1; i >= 0; i--)
      if (voices[i].end <= now) voices.splice(i, 1);
    const same = voices.findIndex((v) => v.note === note);
    if (same >= 0) silence(voices.splice(same, 1)[0], t);
    while (voices.length >= max) {
      const oldest = voices.shift();
      if (oldest) silence(oldest, t);
    }
  };

  /**
   * One Chime for `note` at `freq` Hz. `s` (0..1) is how hard it's struck:
   * louder and brighter. Returns false if sound is off.
   */
  const chime = (
    note: number,
    freq: number,
    s: number,
    { chime: c }: Readonly<Config>,
    delay = 0,
  ) => {
    if (!enabled || !ctx || !dry || !wet || ctx.state !== "running")
      return false;
    const t = ctx.currentTime + LOOKAHEAD + delay;

    if (t - lastStart < MIN_GAP) return false;
    lastStart = t;

    makeRoom(note, t, ctx.currentTime, c.voices);

    const material = MATERIALS[c.material];
    const ring = c.ring * material.ring;
    const end = t + c.strike + ring * 1.6;
    // each voice gets an equal share of the volume; the soft clipper handles rare pile-ups.
    // Every gain starts at its scheduled level, not the default 1: Safari sometimes plays a
    // new voice at that default, ~16x too loud (`pnpm run audio-check webkit` catches it).
    const gain = new GainNode(ctx, { gain: 0 });
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(
      (c.volume / c.voices) * (1 - c.dynamics + c.dynamics * s),
      t + c.strike,
    );
    gain.gain.setTargetAtTime(0, t + c.strike, ring / 4);
    gain.connect(dry);
    gain.connect(wet);

    const total = material.levels.reduce((a, b) => a + b, 0);
    const sources = material.ratios.map((ratio, i) => {
      const osc = new OscillatorNode(ctx as AudioContext, {
        // a few cents of random detune keeps repeated notes alive
        frequency:
          freq * ratio * 2 ** (((Math.random() - 0.5) * c.detune) / 1200),
      });
      // higher partials fade faster and come in with brightness and a harder strike
      const bright = i === 0 ? 1 : c.brightness * (0.3 + 0.7 * s);
      const level = (material.levels[i] * bright) / total;
      const partial = new GainNode(ctx as AudioContext, { gain: level });
      partial.gain.setValueAtTime(level, t);
      partial.gain.setTargetAtTime(0, t, ring / (4 * (1 + i * 1.5)));
      osc.connect(partial).connect(gain);
      osc.start(t);
      osc.stop(end);
      return osc;
    });

    voices.push({ note, gain, sources, end });
    return true;
  };

  /** Accepted Chimes only: the caller can draw feedback without knowing playback policy. */
  const play = (
    crossings: readonly Crossing[],
    dt: number,
    cfg: Readonly<Config>,
  ) => {
    if (!enabled) return [];
    const { chime: c } = cfg;
    return crossings.flatMap((crossing, i) => {
      const note = noteForLength(
        lengths.values[crossing.column],
        lengths.min,
        lengths.max,
        c.notes,
      );
      const target = Math.min(
        1,
        Math.max(0, (crossing.speed - c.minSpeed) / (c.maxSpeed - c.minSpeed)),
      );
      // Uneven pointer events can spike one crossing's speed; follow it over a few Chimes to even out loudness and brightness.
      strike += (target - strike) * 0.25;
      const strength = strike;
      // Spread a frame's Chimes into a run, preserving Rustle's travel order.
      return chime(
        note,
        frequency(note, c.root, c.scale),
        strength,
        cfg,
        (i / crossings.length) * dt,
      )
        ? [{ strength, scalePosition: note / Math.max(1, c.notes - 1) }]
        : [];
    });
  };

  const enable = async (cfg: Readonly<Config>) => {
    enabled = true;
    if (!ctx) {
      ctx = new AudioContext();
      const clip = softClip(ctx);
      clip.output.connect(ctx.destination);
      const out = clip.input;
      dry = new GainNode(ctx, { gain: 1 });
      dry.connect(out);
      wet = new GainNode(ctx, { gain: cfg.chime.reverb });
      wet.connect(room(ctx, 1.4)).connect(out);
    }
    if (wet) wet.gain.value = cfg.chime.reverb;
    await ctx.resume();
    // An off request may arrive while resume is pending; never let that resume win.
    if (!enabled) await ctx.suspend();
  };

  const disable = async () => {
    enabled = false;
    await ctx?.suspend();
  };

  return { enable, disable, setLengths, play };
};
