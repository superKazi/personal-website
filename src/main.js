import { debounce } from "https://cdn.skypack.dev/pin/mini-debounce@v1.0.8-Zdrw8ioDWJBckPavi5e3/min/mini-debounce.js";

// perfect vh
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

window.addEventListener(
  "resize",
  debounce(() => {
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, 300),
  { passive: true }
);

// animate bang
const bang = document.querySelector(".bang");

bang.addEventListener("animationend", () => (bang.style.animationName = ""), {
  passive: true,
});

const interactions = [
  "scroll",
  "resize",
  "devicemotion",
  "deviceorientation",
  "mousedown",
  "mousemove",
  "touchstart",
  "keydown",
];

const animations = ["groove", "pop", "swing", "spin"];
let lastPlayed = "";

interactions.forEach((interaction) =>
  window.addEventListener(interaction, debounce(animateBang, 1000), {
    passive: true,
  })
);

function animateBang() {
  if (window.matchMedia("(orientation: landscape)").matches) {
    if (bang.style.animationName === "") {
      if (lastPlayed === "") {
        bang.style.animationName =
          animations[Math.floor(Math.random() * animations.length)];
        lastPlayed = bang.style.animationName;
      } else {
        const filtered = animations.filter(
          (animation) => animation !== lastPlayed
        );
        bang.style.animationName =
          filtered[Math.floor(Math.random() * filtered.length)];
        lastPlayed = bang.style.animationName;
      }
    }
  }
}

// remove leftover workbox sw stuff
if (typeof indexedDB.databases === "function") {
  indexedDB
    .databases()
    .then((dbs) => {
      if (dbs.length > 0) {
        dbs.forEach((db) => indexedDB.deleteDatabase(db.name));
      }
    })
    .then(() => null)
    .catch((e) => console.error(e));
}

// polite console
console.log(
  "%cThanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);
