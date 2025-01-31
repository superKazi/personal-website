import { shuffle, sample, debounce } from "es-toolkit";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import colors from "./colors.json";

gsap.registerPlugin(Observer);

const colorBoxContainer = document.querySelector("figure");
const mm = gsap.matchMedia();
let swatch = shuffle(sample(colors));

boxSize();
window.addEventListener("resize", debounce(boxSize, 100));
gsap.set("a", {
  "--color": (index: number) => swatch[index].hex,
});
gsap.set("b", {
  backgroundColor: (index) => swatch[index].hex,
});
gsap.set("b span", {
  innerText: (index: number) => swatch[index].name,
});

/**
 * animations
 */

mm.add("(prefers-reduced-motion: no-preference)", () => {
  gsap.to("b", {
    scale: 1,
    duration: 3,
    ease: "elastic.out(1, 0.75)",
    stagger: 0.15,
    onComplete: () => {
      let animating = false;
      Observer.create({
        target: window,
        type: "wheel,touch,scroll",
        onChangeY: () => {
          if (animating === false) {
            gsap.to("b", {
              scale: 0,
              duration: 0.8,
              ease: "circ.in",
              stagger: 0.15,
              onStart: () => {
                animating = true;
              },
              onComplete: () => {
                swatch = shuffle(sample(colors));
                gsap.set("a", {
                  "--color": (index: number) => swatch[index].hex,
                });
                gsap.set("b", {
                  backgroundColor: (index) => swatch[index].hex,
                });
                gsap.set("b span", {
                  innerText: (index: number) => swatch[index].name,
                });
                gsap.to("b", {
                  scale: 1,
                  duration: 3,
                  ease: "elastic.out(1, 0.75)",
                  stagger: 0.15,
                  onComplete: () => {
                    console.log(
                      "%cHere's the Sanzo Wada color swatch:",
                      `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
                        "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
                    );
                    console.table(swatch);
                    animating = false;
                  },
                });
              },
            });
          }
        },
      });
    },
  });
});

mm.add("(prefers-reduced-motion)", () => {
  gsap.to("b", {
    opacity: 1,
    duration: 1,
    ease: "none",
    stagger: 0.15,
    onComplete: () => {
      let animating = false;
      Observer.create({
        target: window,
        type: "wheel,touch,scroll",
        onChangeY: () => {
          if (animating === false) {
            gsap.to("b", {
              opacity: 0,
              duration: 0.4,
              ease: "none",
              stagger: 0.15,
              onStart: () => {
                animating = true;
              },
              onComplete: () => {
                swatch = shuffle(sample(colors));
                gsap.set("b", {
                  backgroundColor: (index) => swatch[index].hex,
                });
                gsap.set("a", {
                  "--color": (index: number) => swatch[index].hex,
                });
                gsap.to("b", {
                  opacity: 1,
                  duration: 1,
                  ease: "none",
                  stagger: 0.15,
                  onComplete: () => {
                    console.log(
                      "%cHere's the Sanzo Wada color swatch:",
                      `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
                        "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
                    );
                    console.table(swatch);
                    animating = false;
                  },
                });
              },
            });
          }
        },
      });
    },
  });
});

/**
 * sets up boxes and resizes them later
 */
function boxSize() {
  const dimensions = colorBoxContainer?.getBoundingClientRect();
  const { width, height } = dimensions
    ? { width: dimensions.width, height: dimensions.height }
    : { width: 0, height: 0 };

  if (width > height || width === height) {
    gsap.set("b", {
      width: (index) =>
        `calc(${height / (index === 0 ? index + 1 : index + 0.5)}px - 3rem)`,
      height: (index) =>
        `calc(${height / (index === 0 ? index + 1 : index + 0.5)}px - 3rem)`,
    });
  } else {
    gsap.set("b", {
      width: (index) =>
        `calc(${width / (index === 0 ? index + 1 : index + 0.5)}px - 3rem)`,
      height: (index) =>
        `calc(${width / (index === 0 ? index + 1 : index + 0.5)}px - 3rem)`,
    });
  }
}

/**
 * handle service worker
 */
!(async function handleServiceWorker() {
  if ("serviceWorker" in navigator) {
    try {
      const { Workbox } = await import("workbox-window");
      const wb = new Workbox("/sw.js");

      wb.addEventListener("installed", (event) => {
        if (event.isUpdate) {
          window.location.reload();
        }
      });

      wb.register();
    } catch (err) {
      console.error(err);
    }
  }
})();

/**
 * polite console
 */
console.log(
  "%cThanks for visiting!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
console.log(
  "%cHere's the Sanzo Wada color swatch:",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
		"Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
console.table(swatch);
