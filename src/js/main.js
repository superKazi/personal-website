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

//
//

/**
 * @license
 * * © 2021 Daniel Aleksandersen <https://www.daniel.priv.no/>
 * * SPDX-License-Identifier: Apache-2.0
 *
 * * © 2016–2017 The New York Times Company <https://www.nytco.com/>
 * * SPDX-License-Identifier: Apache-2.0
 */

(function () {
  // initializes recursive binary search
  function balanceText(element) {
    if (textElementIsMultipleLines(element)) {
      element.style.maxWidth = null;
      const width = element.parentElement.clientWidth;
      const bottomRange = Math.max(100, parseInt(width / 2));
      squeezeContainer(element, element.clientHeight, bottomRange, width);
    }
    // reveal text; paired with the .balance-text class that hides text
    element.classList.replace("balance-text", "balanced-text");
  }

  // Make the headline element as narrow as possible while maintaining its current height (number of lines). Binary search.
  function squeezeContainer(headline, originalHeight, bottomRange, topRange) {
    let mid;
    if (bottomRange + 4 >= topRange) {
      headline.style.maxWidth = Math.ceil(topRange) + "px";
      return;
    }
    mid = (bottomRange + topRange) / 2;
    headline.style.maxWidth = mid + "px";

    if (headline.clientHeight > originalHeight) {
      // we've squoze too far and headline has spilled onto an additional line; recurse on wider range
      squeezeContainer(headline, originalHeight, mid, topRange);
    } else {
      // headline has not wrapped to another line; keep squeezing!
      squeezeContainer(headline, originalHeight, bottomRange, mid);
    }
  }

  // check if element text spans multiple lines
  function textElementIsMultipleLines(element) {
    const elementStyles = window.getComputedStyle(element);
    const elementLineHeight = parseInt(elementStyles["line-height"], 10);
    const elementHeight = parseInt(elementStyles["height"], 10);
    return elementLineHeight < elementHeight;
  }

  function initialize() {
    // future-proofing: the browser natively supports text balancing
    if (window.CSS && CSS.supports("text-wrap", "balance")) {
      return;
    }

    const candidates = document.querySelectorAll(".balance-text");

    if (window.ResizeObserver) {
      const observer = new ResizeObserver(function (entries) {
        entries.forEach(function (entry) {
          let elements = entry.target.querySelectorAll(
            ".balance-text,.balanced-text"
          );
          elements.forEach((element) => {
            balanceText(element);
          });
        });
      });
      candidates.forEach((candidate) => {
        observer.observe(candidate.parentElement);
      });
    } else {
      for (let element of candidates) {
        balanceText(element);
      }
    }
  }

  // run now or when document has loaded
  if (["complete", "interactive"].includes(document.readyState)) {
    initialize();
  } else {
    document.addEventListener("readystatechange", initialize);
  }
})();

// timer-based fallback if text doesn’t appear after three seconds
(function () {
  function revealText() {
    const texts = document.querySelectorAll(".balance-text");
    if (texts) {
      texts.forEach((text) => {
        if (text.classList) {
          // classList.replace isn’t supported in older browsers
          text.classList.remove("balance-text");
          text.classList.add("balanced-text");
        }
      });
    }
  }

  setTimeout(revealText, 3000);
})();
