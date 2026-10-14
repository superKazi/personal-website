import { MATERIALS } from "./chime.ts";
import type { Config } from "./config.ts";

/**
 * The page's one AudioContext. Browsers only let audio start inside a user
 * gesture, so `enable` must be called from the Sound toggle's press.
 * Respects the iOS silent switch: we never override the audio session type.
 */
export const createAudio = () => {
  // eslint-disable-next-line functional/no-let
  let ctx: AudioContext | undefined;
  // eslint-disable-next-line functional/no-let
  let dry: GainNode | undefined;
  // eslint-disable-next-line functional/no-let
  let wet: GainNode | undefined;
  /** the voice currently ringing for each note, so a retrigger can fade it first */
  const ringing = new Map<number, GainNode>();
  // eslint-disable-next-line functional/no-let
  let voices = 0;

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

  /** The wooden "tok" of the strike: a few milliseconds of filtered noise. */
  const knock = (
    c: AudioContext,
    out: AudioNode,
    freq: number,
    gain: number,
    t: number,
  ) => {
    const length = Math.floor(c.sampleRate * 0.02);
    const buffer = c.createBuffer(1, length, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    const source = c.createBufferSource();
    source.buffer = buffer;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = Math.min(freq * 3, 8000);
    filter.Q.value = 0.6;
    const env = c.createGain();
    env.gain.setValueAtTime(gain, t);
    env.gain.setTargetAtTime(0, t, 0.004);
    source.connect(filter).connect(env).connect(out);
    source.start(t);
  };

  /**
   * One Chime at `freq` Hz. `s` (0..1) is how hard it's struck: louder and brighter.
   * Returns false if skipped (sound off or too many ringing).
   */
  const chime = (
    note: number,
    freq: number,
    s: number,
    { chime: c }: Readonly<Config>,
    delay = 0,
  ) => {
    if (!ctx || !dry || !wet || ctx.state !== "running") return false;
    if (voices >= c.voices && !ringing.has(note)) return false;
    const t = ctx.currentTime + delay;
    const material = MATERIALS[c.material];
    const ring = c.ring * material.ring;

    // a retriggered note fades out instead of stacking on itself
    ringing.get(note)?.gain.setTargetAtTime(0, t, 0.015);

    // each voice gets an equal share of the volume, so even all of them can't clip
    const voice = ctx.createGain();
    const peak = (c.volume / c.voices) * (0.3 + 0.7 * s);
    voice.gain.setValueAtTime(0, t);
    voice.gain.linearRampToValueAtTime(peak, t + c.strike);
    voice.gain.setTargetAtTime(0, t + c.strike, ring / 4);
    voice.connect(dry);
    voice.connect(wet);
    const end = t + c.strike + ring * 1.6;

    const total = material.levels.reduce((a, b) => a + b, 0);
    material.ratios.forEach((ratio, i) => {
      if (!ctx) return;
      const osc = ctx.createOscillator();
      // a few cents of random detune keeps repeated notes alive
      osc.frequency.value =
        freq * ratio * 2 ** (((Math.random() - 0.5) * c.detune) / 1200);
      const partial = ctx.createGain();
      // higher partials fade faster and come in with brightness and a harder strike
      const bright = i === 0 ? 1 : c.brightness * (0.3 + 0.7 * s);
      partial.gain.setValueAtTime((material.levels[i] * bright) / total, t);
      partial.gain.setTargetAtTime(0, t, ring / (4 * (1 + i * 1.5)));
      osc.connect(partial).connect(voice);
      osc.start(t);
      osc.stop(end);
    });
    if (c.knock > 0) knock(ctx, voice, freq, (c.knock * material.knock) / 2, t);

    ringing.set(note, voice);
    voices++;
    setTimeout(
      () => {
        voices--;
        if (ringing.get(note) === voice) ringing.delete(note);
      },
      (end - ctx.currentTime) * 1000,
    );
    return true;
  };

  /** Apply volume-independent mix settings. */
  const mix = ({ chime: c }: Readonly<Config>) => {
    if (wet) wet.gain.value = c.reverb;
  };

  const enable = async (cfg: Readonly<Config>) => {
    if (!ctx) {
      ctx = new AudioContext();
      // safety net only; per-voice headroom keeps the sum under full scale
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -3;
      limiter.knee.value = 0;
      limiter.ratio.value = 20;
      limiter.attack.value = 0.001;
      limiter.release.value = 0.2;
      limiter.connect(ctx.destination);
      dry = ctx.createGain();
      dry.connect(limiter);
      wet = ctx.createGain();
      wet.connect(room(ctx, 2.2)).connect(limiter);
    }
    mix(cfg);
    await ctx.resume();
  };

  const disable = () => void ctx?.suspend();

  return { enable, disable, chime, mix };
};

export type Audio = ReturnType<typeof createAudio>;
