import { debounce } from "https://cdn.skypack.dev/pin/mini-debounce@v1.0.8-Zdrw8ioDWJBckPavi5e3/min/mini-debounce.js";

// animate bang
const bang = document.querySelector(".bang");

if (bang) {
  bang.addEventListener("animationend", () => (bang.style.animationName = ""), {
    passive: true,
  });

  const interactions = [
    "scroll",
    "resize",
    "mousedown",
    "mousemove",
    "touchstart",
    "keydown",
  ];

  interactions.forEach((interaction) =>
    window.addEventListener(interaction, debounce(animateBang, 1000), {
      passive: true,
    })
  );

  const animations = ["groove", "pop", "swing", "spin"];
  let lastPlayed = "";

  function animateBang() {
    if (
      window.matchMedia("(orientation: landscape)").matches &&
      bang.style.animationName === ""
    ) {
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
