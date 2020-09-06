import "./styles/style.css";
import { debounce } from "mini-debounce";
import { Workbox } from "workbox-window";
import { Notyf } from "notyf";
import Splitting from "splitting";

Splitting({
  target: [document.querySelector("#kazi"), document.querySelector("#link")],
});

const fancyLetters = {
  eArr: ["e", "ĕ", "ě", "ë"],
  sArr: ["s", "ş"],
  wArr: ["w", "ŵ"],
  oArr: ["o", "ŏ", "ô"],
};

const rowFancyLetters = [
  ...document.querySelectorAll("#link a .word .char"),
].filter((character) => {
  const { innerText } = character;
  return (
    innerText === "e" ||
    innerText === "s" ||
    innerText === "w" ||
    innerText === "o"
  );
});

rowFancyLetters.forEach((letter) => {
  switch (letter.innerText) {
    case "e":
      letter.innerHTML =
        fancyLetters.eArr[Math.floor(Math.random() * fancyLetters.eArr.length)];
      break;
    case "s":
      letter.innerHTML =
        fancyLetters.sArr[Math.floor(Math.random() * fancyLetters.sArr.length)];
      break;
    case "w":
      letter.innerHTML =
        fancyLetters.wArr[Math.floor(Math.random() * fancyLetters.wArr.length)];
      break;
    case "o":
      letter.innerHTML =
        fancyLetters.oArr[Math.floor(Math.random() * fancyLetters.oArr.length)];
      break;
    default:
      return;
  }
});

// service worker code
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/sw.js");
  const notyf = new Notyf();

  wb.addEventListener("installed", (event) => {
    if (event.isUpdate) {
      notyf.success({
        message:
          "Hiya! My website has changed at least a teeny bit since you last visited. Refresh to get the latest version.",
        duration: 8000,
        icon: false,
        background: window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "white"
          : "black",
        position: {
          x: "left",
          y: "bottom",
        },
        ripple: true,
        className: "kazi-notyf",
        dismissible: true,
      });
    }
  });
  // noinspection JSIgnoredPromiseFromCall
  wb.register();
}

// client code
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

window.addEventListener(
  "resize",
  debounce(() => {
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, 300)
);

// polite console
console.log(
  "%c Thanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);
