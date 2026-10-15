/** Pentatonic scales as semitones above the root: no two notes clash, in any order. */
const SCALES = {
  hirajoshi: [0, 2, 3, 7, 8],
} as const;

export type Scale = keyof typeof SCALES;

/** Overtone recipes: frequency ratios and loudness of each partial, and how long it rings. */
export const MATERIALS = {
  // hollow tube: a strong fundamental and a few quick-fading overtones
  bamboo: {
    ratios: [1, 2.02, 3.9],
    levels: [1, 0.28, 0.08],
    ring: 1,
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

/**
 * A Panel's note from its length, like a real chime: the longest rings the root,
 * the shortest `notes - 1` steps up the scale.
 */
export const noteForLength = (
  length: number,
  min: number,
  max: number,
  notes: number,
) => (max > min ? Math.round(((max - length) / (max - min)) * (notes - 1)) : 0);
