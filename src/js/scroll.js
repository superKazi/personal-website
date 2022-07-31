/**
 * Animates the conic gradient on the page on scroll
 * @requires motion
 * @exports scrollyFun
 * @see {@link https://motion.dev/dom/scroll} for scroll library documentation
 */

import { scroll } from "motion";

/**
 * @function scrollyFun
 * @description creates scope for lerpedAnimation so it can be exported
 */
function scrollyFun() {
  let currentY = 0;
  let targetY = 0;

  /**
   * @function lerpedAnimation
   * @description iife that recursively runs via requestAnimationFrame. It listens for vertical scroll and then updates a css custom property using an interpolated value on the next frame.
   */
  (function lerpedAnimation() {
    scroll(({ y }) => {
      targetY = mapRange(0, 1, clamp(0, y.progress, 1), 0, 360);
    });
    const deltaY = targetY - currentY;
    currentY += deltaY * 0.05;
    document.documentElement.style.setProperty("--deg", `${currentY}deg`);

    requestAnimationFrame(lerpedAnimation);
  })();
}

/**
 * @function mapRange
 * @param {number} in_min - the minimum input value
 * @param {number} in_max - the maximum input value
 * @param {number} input - the input value
 * @param {number} out_min - the minimum output value
 * @param {number} out_max - the maxim output value
 * @returns {number} a linear domain range converted value
 * @description taken from {@link https://github.com/studio-freight/lenis}
 */
function mapRange(in_min, in_max, input, out_min, out_max) {
  return ((input - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

/**
 * @function mapRange
 * @param {number} min - the minimum output value
 * @param {number} input - the input value
 * @param {number} max - the maximum output value
 * @returns {number} a value not less than the min or greater than the max
 * @description taken from {@link https://github.com/studio-freight/lenis}
 */
function clamp(min, input, max) {
  return Math.max(min, Math.min(input, max));
}

export { scrollyFun };
