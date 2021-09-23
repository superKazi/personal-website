import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

function scrollyFun() {
  gsap.registerPlugin(ScrollTrigger);

  const tween = gsap.to(document.documentElement, {
    "--deg": "360deg",
    ease: "sine.out",
  });

  ScrollTrigger.create({
    animation: tween,
    trigger: "main",
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
  });
}

export { scrollyFun };
