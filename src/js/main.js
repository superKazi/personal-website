// set up variables for functions
const allowAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)"
).matches;

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

// add gradient scroll animation
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

// polite console
console.log(
  "%cThanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);
