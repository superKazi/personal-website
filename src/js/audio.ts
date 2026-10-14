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
  let noise: AudioBuffer | undefined;
  // eslint-disable-next-line functional/no-let
  let voices = 0;

  /** One second of white noise, reused by every Flick. */
  const noiseBuffer = (c: AudioContext) => {
    if (noise) return noise;
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return noise;
  };

  /** A filtered noise burst with a quick attack and exponential decay. */
  const burst = (
    c: AudioContext,
    type: BiquadFilterType,
    frequency: number,
    q: number,
    gain: number,
    attack: number,
    decay: number,
    t: number,
  ) => {
    const source = c.createBufferSource();
    source.buffer = noiseBuffer(c);
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    env.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    source.connect(filter).connect(env).connect(c.destination);
    source.start(t, Math.random() * 0.9);
    source.stop(t + attack + decay + 0.02);
    return source;
  };

  /**
   * One Flick: a crisp tick (the edge snapping past) over a short swish (the
   * sheet moving air). Faster Rustles are louder and brighter.
   * Returns the 0..1 intensity played, or 0 if skipped.
   */
  const flick = (speed: number, { flick: f }: Readonly<Config>, delay = 0) => {
    if (!ctx || ctx.state !== "running" || voices >= f.voices) return 0;
    const s = Math.min(
      1,
      Math.max(0, (speed - f.minSpeed) / (f.maxSpeed - f.minSpeed)),
    );
    if (s <= 0) return 0;
    // small random spread so repeated Flicks never sound mechanical
    const vary = 1 + (Math.random() - 0.5) * f.variation;
    const t = ctx.currentTime + delay;
    const gain = f.volume * (0.25 + 0.75 * s);
    const frequency =
      (f.lowFrequency + (f.highFrequency - f.lowFrequency) * s) * vary;
    burst(
      ctx,
      "highpass",
      frequency * 1.6,
      0.7,
      gain * f.tick,
      f.attack,
      f.decay * 0.35,
      t,
    );
    const swish = burst(
      ctx,
      "bandpass",
      frequency,
      f.q,
      gain,
      f.attack,
      f.decay * vary,
      t,
    );
    voices++;
    swish.addEventListener("ended", () => voices--);
    return s;
  };

  const enable = async () => {
    ctx ??= new AudioContext();
    await ctx.resume();
  };

  const disable = () => void ctx?.suspend();

  return { enable, disable, flick };
};

export type Audio = ReturnType<typeof createAudio>;
