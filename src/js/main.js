import balanceText from "balance-text";

/**
 * @description set up accessibility variable for scrolly function
 */

const allowAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)"
).matches;

/**
 * @description balance page type on larger screens
 */

if (window.matchMedia("(min-width: 600px)").matches) {
  balanceText();
}

/**
 * @description only load and run scroll animations if they want animations
 */

if (allowAnimations) {
  (async function initScrollyFun() {
    try {
      const { scrollyFun } = await import("./scroll.js");
      scrollyFun();
    } catch (err) {
      console.error(err);
    }
  })();
}

/**
 * @description remove leftover workbox sw stuff
 */

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

/**
 * @description polite console
 */

console.log(
  "%cThanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);
