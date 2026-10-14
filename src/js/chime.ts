/** Pentatonic scales as semitones above the root: no two notes clash, in any order. */
export const SCALES = {
  yo: [0, 2, 5, 7, 9],
  in: [0, 1, 5, 7, 8],
  hirajoshi: [0, 2, 3, 7, 8],
  majorPentatonic: [0, 2, 4, 7, 9],
  minorPentatonic: [0, 3, 5, 7, 10],
} as const;

export type Scale = keyof typeof SCALES;

/** Overtone recipes: frequency ratios and loudness of each partial, and how long it rings. */
export const MATERIALS = {
  // hollow tube: a strong fundamental, a few quick-fading overtones and a wooden knock
  bamboo: {
    ratios: [1, 2.02, 3.9],
    levels: [1, 0.28, 0.08],
    ring: 1,
    knock: 1,
  },
  // struck metal tube: inharmonic overtones that shimmer and ring long
  metal: {
    ratios: [1, 2.76, 5.4, 8.93],
    levels: [1, 0.5, 0.28, 0.12],
    ring: 3.5,
    knock: 0.15,
  },
} as const;

export type Material = keyof typeof MATERIALS;

/** Frequency of note `n` counted up the scale from the root, wrapping into higher octaves. */
export const frequency = (n: number, root: number, scale: Scale) => {
  const steps = SCALES[scale];
  const octave = Math.floor(n / steps.length);
  const semitone = steps[n % steps.length] + 12 * octave;
  return root * 2 ** (semitone / 12);
};

/** Which of `notes` stretches of the word position `x` falls in, left to right. */
export const noteAt = (x: number, min: number, span: number, notes: number) =>
  Math.min(notes - 1, Math.max(0, Math.floor(((x - min) / span) * notes)));
