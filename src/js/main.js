// TODO: Add better comments

import { gsap } from "gsap";
import { Observer } from "gsap/Observer";

/**
 * @description set up animations
 */
gsap.registerPlugin(Observer);
let currentTime = 0;

const tween = gsap.to("rect", {
  duration: 1,
  opacity: 0.8,
  ease: "none",
  stagger: {
    amount: 10,
    grid: [100, 100],
    from: "random",
    ease: "none",
    yoyo: true,
    repeat: -1,
  },
});

tween.pause();

Observer.create({
  target: window,
  type: "pointer, touch",
  onDrag: playAnimation,
  onMove: playAnimation,
});

function playAnimation() {
  currentTime += 0.1;
  tween.seek(gsap.utils.wrapYoyo(0, tween.totalDuration(), currentTime));
}

/**
 * @description remove leftover workbox sw stuff
 */

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

/**
 * @description polite console
 */

console.log(
  "%cThanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;"
);
