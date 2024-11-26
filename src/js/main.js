import Splitting from "splitting";
import { spring, cubicBezier, animate, stagger, transform } from "motion";

const allowsAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)",
).matches;

if (allowsAnimations) {
  Splitting();

  const sequence = [
    [
      ".char",
      {
        opacity: 1,
        y: [50, 0],
      },
      {
        delay: stagger(0.075),
        type: spring,
        bounce: 0.32,
      },
    ],
    [
      ".screen",
      { scaleY: 0 },
      { at: "-0.6", duration: 1, ease: cubicBezier(0.32, 0, 0.67, 0) },
    ],
    [
      ".char",
      {
        color: "#0d0d0d",
      },
      {
        at: "-0.8",
        duration: 0.6,
        ease: "linear",
      },
    ],
    [
      "p",
      { opacity: 1, filter: "blur(0px)" },
      { at: "-0.2", duration: 0.8, ease: "linear" },
    ],
  ];

  animate(sequence).then(async () => {
    try {
      const { colorThings } = await import("./boxes.js");
      colorThings();
    } catch (err) {
      console.error(err);
    }
  });
}

/**
 * handle service worker
 */
!(async function handleServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const { Workbox } = await import("workbox-window");
      const wb = new Workbox("/sw.js");

      wb.addEventListener("installed", (event) => {
        if (event.isUpdate) {
          window.location.reload();
        }
      });

      wb.register();
    } catch (err) {
      console.error(err);
    }
  }
})();

/**
 * polite console
 */
console.log(
  "%cThanks for visiting!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
