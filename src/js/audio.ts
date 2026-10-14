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

  /** One second of white noise, reused by every paper sound. */
  const noiseBuffer = (c: AudioContext) => {
    if (noise) return noise;
    noise = c.createBuffer(1, c.sampleRate, c.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return noise;
  };

  /** A short burst of filtered noise: the building block of paper sounds. */
  const burst = (
    frequency: number,
    q: number,
    gain: number,
    length: number,
    at = 0,
  ) => {
    if (!ctx) return;
    const t = ctx.currentTime + at;
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const env = ctx.createGain();
    env.gain.setValueAtTime(0, t);
    env.gain.linearRampToValueAtTime(gain, t + 0.004);
    env.gain.exponentialRampToValueAtTime(0.0001, t + length);
    source.connect(filter).connect(env).connect(ctx.destination);
    source.start(t, Math.random() * 0.5);
    source.stop(t + length + 0.02);
  };

  const enable = async () => {
    ctx ??= new AudioContext();
    await ctx.resume();
    // confirmation: two soft paper ticks, low then high
    burst(1800, 1.2, 0.12, 0.09);
    burst(3200, 1.4, 0.1, 0.08, 0.07);
  };

  const disable = () => void ctx?.suspend();

  return { enable, disable, burst, context: () => ctx };
};

export type Audio = ReturnType<typeof createAudio>;
