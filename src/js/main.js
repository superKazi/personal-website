import Splitting from "splitting";
import { timeline, stagger } from "motion";

const allowsAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)",
).matches;

if (allowsAnimations) {
  Splitting();

  const sequence = [
    [
      ".screen",
      { transform: "scaleY(0)" },
      { duration: 1.6, easing: "cubic-bezier(0.32, 0, 0.67, 0)" },
    ],
    [
      ".char",
      { opacity: 0.8 },
      {
        at: "-1",
        duration: 1,
        delay: stagger(0.15),
        easing: "linear",
      },
    ],
    [
      ".char",
      { transform: ["translateY(200%)", "translateY(0)"] },
      {
        at: "<",
        duration: 0.8,
        delay: stagger(0.1),
        easing: "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
    ],
    [
      "p",
      { opacity: 1, filter: "blur(0px)" },
      { at: "-0.5", duration: 0.8, easing: "linear" },
    ],
  ];

  timeline(sequence).finished.then(async () => {
    console.log("timeline finished");
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
