import { shuffle, sample, debounce } from "es-toolkit";
import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import colors from "./colors.json";

gsap.registerPlugin(Observer);

const colorBoxContainer = document.querySelector("figure");
const mm = gsap.matchMedia();
let allowScaleAnimation = true;
let isAnimating = false;
let swatch = shuffle(sample(colors));

boxSize();
window.addEventListener("resize", debounce(boxSize, 100));
window.addEventListener("keydown", ({ key }) => {
  if (key === "ArrowUp" || key === "ArrowDown") {
    interactionAnimation();
  }
});
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
 * accessible animations
 */
mm.add(
  {
    allowsAnimation: "(prefers-reduced-motion: no-preference)",
    reducedAnimation: "(prefers-reduced-motion: reduce)",
  },
  (context) => {
    let conditions = context?.conditions;
    if (conditions) {
      allowScaleAnimation = conditions.allowsAnimation;
      gsap.to("b", {
        opacity: 1,
        scale: 1,
        duration: allowScaleAnimation ? 3 : 1,
        ease: allowScaleAnimation ? "elastic.out(1, 0.75)" : "none",
        stagger: 0.15,
        onComplete: () => {
          Observer.create({
            target: window,
            type: "wheel,touch,scroll",
            onChangeY: interactionAnimation,
          });
        },
      });
    }
  },
);

/**
 * sets up interactionAnimation
 */
function interactionAnimation() {
  if (!isAnimating) {
    gsap.to("b", {
      opacity: allowScaleAnimation ? 1 : 0,
      scale: allowScaleAnimation ? 0 : 1,
      duration: allowScaleAnimation ? 0.8 : 0.4,
      ease: allowScaleAnimation ? "circ.in" : "none",
      stagger: 0.15,
      onStart: () => {
        isAnimating = true;
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
          opacity: 1,
          scale: 1,
          duration: allowScaleAnimation ? 3 : 1,
          ease: allowScaleAnimation ? "elastic.out(1, 0.75)" : "none",
          stagger: 0.15,
          onComplete: () => {
            console.log(
              "%cHere's the Sanzo Wada color swatch:",
              `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
                  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
            );
            console.table(swatch);
            isAnimating = false;
          },
        });
      },
    });
  }
}

/**
 * sets up boxes and sizes them
 */
function boxSize() {
  let dimensions = colorBoxContainer?.getBoundingClientRect();
  let { width, height } = dimensions
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
