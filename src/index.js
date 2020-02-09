import "./styles/style.scss";
import { debounce } from "mini-debounce";
import { Workbox } from "workbox-window";
import { Notyf } from "notyf";

// service worker code
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/sw.js");
  const notyf = new Notyf();

  wb.addEventListener("installed", event => {
    if (event.isUpdate) {
      notyf.success({
        message:
          "Hiya! My website has changed at least a teeny bit since you last visited. Refresh to get the latest version.",
        duration: 8000,
        icon: false,
        backgroundColor: "#0c0c0c",
        ripple: true
      });
    }
  });
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

const openButton = document.querySelector("#open");
const closeButton = document.querySelector("#close");
const poster = document.querySelector("#poster");
const work = document.querySelector("#work");

let clickCount = false;

openButton.onclick = () => {
  if (!clickCount) {
    poster.setAttribute("style", "transform: translateX(100%); opacity:0;");
    work.setAttribute("style", "transform: translateX(0); opacity:1;");
    clickCount = !clickCount;
  }
};

closeButton.onclick = () => {
  if (clickCount) {
    poster.setAttribute("style", "transform: translateX(0%); opacity:1;");
    work.setAttribute("style", "transform: translateX(-100%); opacity:1;");
    clickCount = !clickCount;
  }
};

// polite console
console.log(
  "%c Thanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem;color: black; text-shadow: 3px 3px 0 rgb(247,121,125) , 6px 6px 0 rgb(247,121,125) , 9px 9px 0 rgb(251,215,123) , 12px 12px 0 rgb(251,215,123) , 15px 15px 0 rgb(198,255,221) , 18px 18px 0 rgb(198,255,221) , 21px 21px 0 rgb(198,255,221)"
);
