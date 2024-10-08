import Splitting from "splitting";
import { timeline, stagger } from "motion";

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
        transform: "translateY(0)",
      },
      {
        duration: 0.6,
        delay: stagger(0.075),
        easing: "linear",
        transform: { easing: "cubic-bezier(0.34, 1.56, 0.64, 1)" },
      },
    ],
    [
      ".char",
      {
        color: "#0d0d0d",
      },
      {
        duration: 0.6,
        easing: "linear",
      },
    ],
    [
      ".screen",
      { transform: "scaleY(0)" },
      { at: "-0.8", duration: 1, easing: "cubic-bezier(0.32, 0, 0.67, 0)" },
    ],
    [
      "p",
      { opacity: 1, filter: "blur(0px)" },
      { at: "-.6", duration: 0.8, easing: "linear" },
    ],
  ];

  timeline(sequence).finished.then(async () => {
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
