import balancetext from "balance-text";
import _debounce from "lodash.debounce";

/**
 * @description set up accessibility variable for scrolly function
 */
const allowAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)"
).matches;

/**
 * @description balance page type
 */
balanceType();

/**
 * @description rebalance type on window resize
 */
window.addEventListener("resize", _debounce(balanceType, 100));

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
 * @function scrollyFun
 * @requires balancetext
 * @description balances type at larger viewports
 * @see {@link https://opensource.adobe.com/balance-text/} for balancetext library documentation
 */
function balanceType() {
  if (window.matchMedia("(min-width: 600px)").matches) {
    balancetext("p");
  }
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
