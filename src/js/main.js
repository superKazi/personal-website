import styles from "../css/style.css";
import _random from "lodash.random";
import _debounce from "lodash.debounce";
import "splitting/dist/splitting.css";
import "splitting/dist/splitting-cells.css";
import Splitting from "splitting";

// force service worker page reload if site updates
handleServiceWorker();

// set up variables for functions
const paragraphs = [...document.querySelectorAll("p")];
const windowWidth = window.innerWidth;
const allowAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)"
).matches;
let isBig = window.matchMedia("(min-width: 960px)").matches;

// place paragraphs on desktop willy nilly
placeParagraphs();

// make links styles weird
Splitting({ target: "a", by: "chars", whitespace: true });
funkyChars();

// add gradient scroll animation
initScrollyFun();

// fix paragraph placement on screen resize
window.addEventListener("resize", _debounce(placeParagraphs, 200));

// polite console
console.log(
  '%cThanks for checking out my site!',
  'font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;'
)

/* Function definitions */

function placeParagraphs() {
  isBig = window.matchMedia("(min-width: 960px)").matches;
  if (isBig) {
    paragraphs.forEach((p) => {
      const { width } = p.getBoundingClientRect();
      const translateX = Math.trunc(_random(windowWidth - width - 50, false));
      p.style.transform = `translateX(${translateX}px)`;
    });
  } else {
    paragraphs.forEach((p) => {
      p.style.transform = "initial";
    });
  }
}

function funkyChars() {
  [...document.querySelectorAll(".char")].forEach((c) => {
    c.style.fontVariationSettings = `'wdth' ${Math.trunc(
      _random(125, 200, false)
    )},'wght' ${Math.trunc(_random(100, 200, false))}, 'opsz' ${Math.trunc(
      _random(100, 200, false)
    )}`;
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

function handleServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", async () => {
      try {
        // https://developers.google.com/web/tools/workbox/modules/workbox-window
        const { Workbox } = await import("workbox-window");
        if (Workbox) {
          const wb = new Workbox("../sw.js");
          wb.addEventListener("installed", (event) => {
            if (event.isUpdate) {
              window.location.reload();
            }
          });
          wb.register();
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
}