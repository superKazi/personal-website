import { gsap } from "gsap";
import { config } from "./config.ts";
import type { Panel } from "./panels.ts";

/**
 * Panels rise from below, left to right along the word.
 * Writes per-Panel progress into `rise` and calls `commit` each frame.
 */
export const playIntro = (
  panels: readonly Panel[],
  // the scene's GPU buffer; mutated in place each frame
  rise: Float32Array,
  commit: () => void,
) => {
  const { intro } = config;
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
