import { config } from "./config.ts";

const WORD = "KAZI";
const FONT_PX = 256;
const FONT = `800 ${FONT_PX}px Degular`;

/** One upright sheet, in cap-height units: x along the word, y0..y1 tall. */
export interface Panel {
  readonly x: number;
  readonly y0: number;
  readonly y1: number;
  readonly color: string;
}

export const loadFont = () => document.fonts.load(FONT, WORD);

// small seeded PRNG (mulberry32) so a seed always gives the same colors
const rng = (seed: number) => {
  // eslint-disable-next-line functional/no-let
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    // eslint-disable-next-line functional/no-let
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Filled vertical runs [top, bottom) in one pixel column. */
const columnRuns = (
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number,
) => {
  const runs: [number, number][] = [];
  // eslint-disable-next-line functional/no-let
  let start = -1;
  for (let y = 0; y <= height; y++) {
    const filled = y < height && data[(y * width + x) * 4 + 3] > 127;
    if (filled && start < 0) start = y;
    if (!filled && start >= 0) {
      // drop slivers from antialiasing
      if (y - start > 2) runs.push([start, y]);
      start = -1;
    }
  }
  return runs;
};

/** Slice the word into Panels and color them in seeded runs. */
export const buildPanels = (): Panel[] => {
  const { panels, color } = config;
  const ctx = new OffscreenCanvas(1, 1).getContext("2d", {
    willReadFrequently: true,
  });
  if (!ctx) return [];
  ctx.font = FONT;
  const letters = [...WORD].map((ch) => ({ ch, m: ctx.measureText(ch) }));
  const cap = letters[0].m.actualBoundingBoxAscent;
  const gap = panels.tracking * cap;
  const pad = 8;
  const inkWidths = letters.map(
    ({ m }) => m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
  );
  const width = Math.ceil(
    inkWidths.reduce((a, b) => a + b, 0) + gap * (WORD.length - 1) + pad * 2,
  );
  const height = Math.ceil(cap + pad * 2);
  ctx.canvas.width = width;
  ctx.canvas.height = height;
  ctx.font = FONT;
  ctx.fillStyle = "#000";
  ctx.textBaseline = "alphabetic";

  const step = cap / panels.density;
  const columns: number[] = [];
  letters.reduce((left, { ch, m }, i) => {
    const ink = inkWidths[i];
    ctx.fillText(ch, left + m.actualBoundingBoxLeft, pad + cap);
    const n = Math.max(1, Math.round(ink / step));
    const first = left + (ink - (n - 1) * step) / 2;
    for (let j = 0; j < n; j++) columns.push(first + j * step);
    return left + ink + gap;
  }, pad);

  const { data } = ctx.getImageData(0, 0, width, height);
  const random = rng(color.seed);
  const pick = (prev: string) => {
    if (random() < color.accentChance && prev !== color.accent)
      return color.accent;
    const options = color.palette.filter((c) => c !== prev);
    return options[Math.floor(random() * options.length)] ?? prev;
  };
  const span = color.runMax - color.runMin + 1;

  // eslint-disable-next-line functional/no-let
  let current = "",
    left = 0;
  return columns.flatMap((x) => {
    if (left-- <= 0) {
      current = pick(current);
      left = color.runMin + Math.floor(random() * span) - 1;
    }
    const px = Math.min(width - 1, Math.round(x));
    return columnRuns(data, width, height, px).map(([top, bottom]) => ({
      x: (x - pad) / cap,
      y0: (pad + cap - bottom) / cap,
      y1: (pad + cap - top) / cap,
      color: current,
    }));
  });
};
