import { gsap } from "gsap";
import type { Config } from "./config.ts";
import type { Panel } from "./panels.ts";

/** Easing choices offered in the dev gui; any GSAP ease string works in config. */
export const EASES = [
  "back.out(1.2)",
  "back.out(1.6)",
  "back.out(2.2)",
  "elastic.out(1,0.75)",
  "expo.out",
  "power3.out",
];

/**
 * Panels rise from below, left to right along the word.
 * Writes per-Panel progress into `rise` and calls `commit` each frame.
 */
export const playIntro = (
  panels: readonly Panel[],
  // the scene's GPU buffer; mutated in place each frame
  rise: Float32Array,
  commit: () => void,
  { intro }: Readonly<Config>,
) => {
  const xs = panels.map((p) => p.x);
  const min = Math.min(...xs);
  const span = Math.max(...xs) - min || 1;
  const progress = panels.map(() => ({ value: 0 }));
  rise.fill(0);
  commit();
  return gsap.to(progress, {
    value: 1,
    duration: intro.duration,
    ease: intro.ease,
    stagger: (i: number) => ((xs[i] - min) / span) * intro.stagger,
    onUpdate: () => {
      progress.forEach((p, i) => (rise[i] = p.value));
      commit();
    },
  });
};
