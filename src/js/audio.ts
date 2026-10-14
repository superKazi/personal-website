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
  let master: GainNode | undefined;
  // eslint-disable-next-line functional/no-let
  let noise: AudioBuffer | undefined;
  // eslint-disable-next-line functional/no-let
  let voices = 0;

  /** Two seconds of pink noise: softer and less hissy than white, like paper on paper. */
  const pinkNoise = (c: AudioContext) => {
    if (noise) return noise;
    noise = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
    const data = noise.getChannelData(0);
    // Paul Kellet's economy pink filter
    // eslint-disable-next-line functional/no-let
    let b0 = 0,
      b1 = 0,
      b2 = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2;
    }
    return noise;
  };

  /** A noise grain: filtered, faded in, then eased out exponentially. */
  const grain = (
    c: AudioContext,
    out: AudioNode,
    type: BiquadFilterType,
    frequency: number,
    gain: number,
    attack: number,
    decay: number,
    t: number,
  ) => {
    const source = c.createBufferSource();
    source.buffer = pinkNoise(c);
    const filter = c.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    // below 0.707 there's no resonant peak, so nothing can ring or ping
    filter.Q.value = 0.5;
    const env = c.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + attack);
    env.gain.setTargetAtTime(0, t + attack, decay / 3);
    source.connect(filter).connect(env).connect(out);
    source.start(t, Math.random() * 1.8);
    source.stop(t + attack + decay * 1.5);
    return source;
  };

  /**
   * One Flick: a soft swish of air, with an optional faint edge tick.
   * Faster Rustles are louder and brighter. Returns the 0..1 intensity played, or 0 if skipped.
   */
  const flick = (speed: number, { flick: f }: Readonly<Config>, delay = 0) => {
    if (!ctx || !master || ctx.state !== "running" || voices >= f.voices)
      return 0;
    const s = Math.min(
      1,
      Math.max(0, (speed - f.minSpeed) / (f.maxSpeed - f.minSpeed)),
    );
    if (s <= 0) return 0;
    master.gain.value = f.volume;
    // small random spread so repeated Flicks never sound mechanical
    const vary = 1 + (Math.random() - 0.5) * f.variation;
    const t = ctx.currentTime + delay;
    const gain = 0.3 + 0.7 * s;
    const cutoff = (f.lowCutoff + (f.highCutoff - f.lowCutoff) * s) * vary;
    const swish = grain(
      ctx,
      master,
      "lowpass",
      cutoff,
      gain,
      f.attack,
      f.decay * vary,
      t,
    );
    if (f.edge > 0)
      grain(
        ctx,
        master,
        "highpass",
        cutoff,
        gain * f.edge,
        f.attack * 0.5,
        f.decay * 0.3,
        t,
      );
    voices++;
    swish.addEventListener("ended", () => voices--);
    return s;
  };

  const enable = async () => {
    if (!ctx) {
      ctx = new AudioContext();
      // every Flick shares one volume and a limiter, so overlaps can't clip
      master = ctx.createGain();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value = -18;
      limiter.knee.value = 12;
      limiter.ratio.value = 8;
      limiter.attack.value = 0.003;
      limiter.release.value = 0.25;
      master.connect(limiter).connect(ctx.destination);
    }
    await ctx.resume();
  };

  const disable = () => void ctx?.suspend();

  return { enable, disable, flick };
};

export type Audio = ReturnType<typeof createAudio>;
