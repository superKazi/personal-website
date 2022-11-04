/**
 * Animates the conic gradient on the page on scroll
 * @requires gsap
 * @exports scrollyFun
 * @see {@link https://greensock.com/docs/v3/Plugins/ScrollTrigger} for scroll library documentation
 */

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * @function scrollyFun
 * @description creates scope for ScrollTrigger animation so it can be exported
 */

gsap.registerPlugin(ScrollTrigger);

function scrollyFun() {
  gsap.to("html", {
    "--deg": "360deg",
    ease: "sine.out",
    scrollTrigger: {
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      scrub: 4,
    },
  });
}

export { scrollyFun };
