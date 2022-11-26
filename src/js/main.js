import balanceText from "balance-text";

/**
 * @description remove leftover workbox sw stuff
 */

if (typeof navigator.serviceWorker === "object" && typeof caches === "object") {
  (async function killServiceWorkers() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      const unregisterPromises = registrations.map((registration) =>
        registration.unregister()
      );

      const allCaches = await caches.keys();
      const cacheDeletionPromises = allCaches.map((cache) =>
        caches.delete(cache)
      );

      const clearAttempted = await Promise.allSettled([
        ...unregisterPromises,
        ...cacheDeletionPromises,
      ]);

      if (clearAttempted.length > 0) {
        if (clearAttempted.includes((p) => p.status === "rejected")) {
          throw new Error(
            "There was an error clearing google workbox information"
          );
        } else {
          window.location.reload();
        }
      }
    } catch (err) {
      console.error(err);
    }
  })();
}

if (typeof indexedDB.databases === "function") {
  (async function clearDbs() {
    try {
      const dbs = await indexedDB.databases();

      if (dbs.length > 0) {
        dbs.forEach((db) => {
          const deletedDb = indexedDB.deleteDatabase(db.name);
          deletedDb.onerror = () => {
            throw new Error("Couldn’t delete google workbox indexDB");
          };
        });
      }
    } catch (err) {
      console.error(err);
    }
  })();
}

/**
 * @description balance page type on larger screens
 */

if (window.matchMedia("(min-width: 600px)").matches) {
  balanceText();
}

/**
 * @description set up accessibility variable for scrolly function
 */

const allowAnimations = window.matchMedia(
  "(prefers-reduced-motion: no-preference)"
).matches;

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
 * @description polite console
 */

console.log(
  "%cThanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);
