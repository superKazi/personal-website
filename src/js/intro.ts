import { gsap } from "gsap";
import { config } from "./config.ts";
import type { Panel } from "./panels.ts";

/** Panels rise from below, left to right along the word, reporting each frame's progress per Panel to `setRise`. */
export const playIntro = (
  panels: readonly Panel[],
  setRise: (values: ArrayLike<number>) => void,
) => {
  const { intro } = config;
  const xs = panels.map((p) => p.x);
  const min = Math.min(...xs);
  const span = Math.max(...xs) - min || 1;
  const progress = panels.map(() => ({ value: 0 }));
  const values = new Float32Array(panels.length);
  setRise(values);
  return gsap.to(progress, {
    value: 1,
    duration: intro.duration,
    ease: intro.ease,
    stagger: (i: number) => ((xs[i] - min) / span) * intro.stagger,
    onUpdate: () => {
      progress.forEach((p, i) => (values[i] = p.value));
      setRise(values);
    },
  });
};
