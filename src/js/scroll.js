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
    trigger: "body",
    start: "top top",
    end: "bottom bottom",
    scrub: 5,
  });
}

export { scrollyFun };
