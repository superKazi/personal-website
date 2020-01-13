import "./styles/style.scss";
import { debounce } from "mini-debounce";
import { Workbox } from "workbox-window";
import { Notyf } from "notyf";

// for mobile spacing using vh
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

window.addEventListener(
  "resize",
  debounce(() => {
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, 300)
);

// service worker code
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/sw.js");
  const notyf = new Notyf();

  wb.addEventListener("installed", event => {
    if (event.isUpdate) {
      notyf.success({
        message:
          "Hiya! My website has changed at least a teeny bit since you last visited. Refresh to get the latest version.",
        duration: 10000,
        icon: false,
        backgroundColor: "black",
        ripple: true
      });
    }
  });
  wb.register();
}

// console links to work
const work = [
  "https://projects.sfchronicle.com/2020/25-must-eats/",
  "https://projects.sfchronicle.com/class-of-2020/fall/",
  "https://projects.sfchronicle.com/2019/kincade-fire-origin/",
  "https://projects.sfchronicle.com/2019/the-fishermans-secret/",
  "https://thecity.nyc/2019/08/aoc-makes-a-bronx-census-push-amid-fears-of-lost-house-seats.html",
  "https://thecity.nyc/2019/06/early-intervention-services-scarce-in-many-neighborhoods.html",
  "https://thecity.nyc/2019/04/small-homeowners-pay-big-fines-for-short-term-rentals.html",
  "https://thecity.nyc/2019/04/high-flying-cy-vance-spent-forfeited-funds-on-travel-and-food.html",
  "https://www.washingtonpost.com/graphics/2018/local/suicide-and-stress-among-police-officers-involved-in-shootings/",
  "https://www.washingtonpost.com/graphics/2018/world/reports-of-hate-crime-cases-have-spiked-in-india/",
  "https://www.washingtonpost.com/graphics/2018/world/how-a-change-in-us-abortion-policy-reverberated-around-the-globe/",
  "https://www.washingtonpost.com/graphics/2018/politics/how-to-flip-the-house-2018/",
  "https://drive.google.com/open?id=1fRYQgklMMrcZmF9JC5R4eUxCunaHErwW",
  "https://drive.google.com/open?id=1ImXuy-flBkEKZ3mRSVMgkhFAY60QDMkU",
  "https://drive.google.com/open?id=1NkOTWBPM8N95luzwkXzR9YabrjLjgKKQ",
  "https://drive.google.com/open?id=1jMdP_I_VLO4my-4ayLxAzAH7UjiXKQrX"
];

console.log(
  "%c Hi, here are some links to my work!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem;color: black; text-shadow: 3px 3px 0 rgb(247,121,125) , 6px 6px 0 rgb(247,121,125) , 9px 9px 0 rgb(251,215,123) , 12px 12px 0 rgb(251,215,123) , 15px 15px 0 rgb(198,255,221) , 18px 18px 0 rgb(198,255,221) , 21px 21px 0 rgb(198,255,221)"
);

work.forEach(link =>
  console.log(
    `%c ${link}`,
    "font-family: Helvetica, sans-serif; font-size: 1.25rem; color: blue; text-decoration: underline;"
  )
);
