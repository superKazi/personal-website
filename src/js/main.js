import _random from "lodash.random";
import "splitting/dist/splitting.css";
import "splitting/dist/splitting-cells.css";
import Splitting from "splitting";

// force service worker page reload if site updates
handleServiceWorker();

// set up variables for functions
const allowAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)"
).matches;

// make links styles weird
Splitting({ target: "a", by: "chars", whitespace: true });
funkyChars();

// add gradient scroll animation
initScrollyFun();

// polite console
console.log(
  "%cThanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);

/* Function definitions */

function funkyChars() {
  [...document.querySelectorAll(".char")].forEach((c) => {
    c.style.fontVariationSettings = `"wght" ${Math.trunc(
      _random(75, 200, false)
    )}, "opsz" 100, "wdth" ${Math.trunc(_random(125, 200, false))}`;
  });
}

async function initScrollyFun() {
  if (allowAnimations) {
    try {
      const { scrollyFun } = await import("./scroll.js");
      scrollyFun();
    } catch (err) {
      console.error(err);
    }
  }
}

async function handleServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      // https://developers.google.com/web/tools/workbox/modules/workbox-window
      const { Workbox } = await import("workbox-window");
      const wb = new Workbox("../sw.js");
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
}
