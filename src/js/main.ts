import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { Observer } from "gsap/Observer";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";

/**
 * accessible animations
 */
gsap.registerPlugin(SplitText, Observer, Draggable, InertiaPlugin);
const mm = gsap.matchMedia();

document.fonts.ready.then(() => {
  let splitLinks = SplitText.create("a", {
    type: "words, chars",
    charsClass: "char list-char",
  });
  splitLinks.elements.forEach((elem) => {
    let selector = gsap.utils.selector(elem);
    let rippleTween = gsap.to(selector(".list-char"), {
      keyframes: {
        "--wght": [800, 500],
      },
      repeat: -1,
      duration: 0.8,
      repeatRefresh: true,
      ease: "sine.in",
      paused: true,
      stagger: 0.05,
    });
    Observer.create({
      target: elem,
      type: "pointer",
      onHover: () => {
        rippleTween.play();
      },
      onHoverEnd: () => {
        rippleTween.pause();
      },
    });
  });

  mm.add("(prefers-reduced-motion: no-preference)", () => {
    let splitHed = SplitText.create("h1", {
      type: "words, chars",
      charsClass: "char++",
    });
    let splitSub = SplitText.create("h2", {
      type: "words, chars",
      charsClass: "char",
    });
    let tl = gsap.timeline();
    let dragItems: GSAPTween[] | undefined[] = [];
    gsap.set("main", { opacity: 1 });

    tl.fromTo(
      splitLinks.chars,
      {
        autoAlpha: 0,
        x: () => gsap.utils.random(-150, 150),
        y: () => gsap.utils.random(-150, 150),
        rotation: () => gsap.utils.random(-45, 45),
      },
      {
        autoAlpha: 1,
        x: 0,
        y: 0,
        rotation: 0,
        ease: "back.out(1)",
        stagger: {
          amount: 6,
        },
      },
    )
      .fromTo(
        splitHed.chars,
        {
          autoAlpha: 0,
          x: () => gsap.utils.random(-50, 50),
          y: () => gsap.utils.random(-50, 50),
          rotation: () => gsap.utils.random(-15, 15),
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotation: 0,
          ease: "back.out(1)",
          duration: 0.6,
          stagger: 0.1,
          onComplete: () => {
            Draggable.create(splitHed.chars, {
              bounds: "body",
              inertia: true,
              throwResistance: 2000,
              overshootTolerance: 2,
              onDragStart: function () {
                let elem = this.target as HTMLDivElement;
                let id = elem.classList[1];
                let found = splitHed.chars.find((char) =>
                  char.classList.contains(id),
                );
                if (found) {
                  dragItems[splitHed.chars.indexOf(found)]?.kill();
                }
              },
              onThrowComplete: function () {
                let absDistanceTraveled = gsap.utils.clamp(
                  0,
                  2000,
                  Math.abs(this.endX) + Math.abs(this.endY),
                );
                let travelTime = gsap.utils.mapRange(
                  0,
                  2000,
                  0.4,
                  1,
                  absDistanceTraveled,
                );
                let elem = this.target as HTMLDivElement;
                let id = elem.classList[1];
                let found = splitHed.chars.find((char) =>
                  char.classList.contains(id),
                );
                if (found) {
                  dragItems[splitHed.chars.indexOf(found)]?.kill();
                  dragItems[splitHed.chars.indexOf(found)] = gsap.delayedCall(
                    gsap.utils.random(1.25, 2.25, 0.25),
                    () => {
                      gsap.to(this.target, {
                        x: 0,
                        y: 0,
                        ease: "back.out(1)",
                        duration: travelTime,
                      });
                    },
                  );
                }
              },
            });
          },
        },
        "-=150%",
      )
      .fromTo(
        splitSub.chars,
        {
          autoAlpha: 0,
          x: () => gsap.utils.random(-150, 150),
          y: () => gsap.utils.random(-150, 150),
          rotation: () => gsap.utils.random(-45, 45),
        },
        {
          autoAlpha: 1,
          x: 0,
          y: 0,
          rotation: 0,
          ease: "back.out(1)",
          duration: 0.4,
          stagger: 0.1,
          onComplete: () => {
            splitSub.revert();
          },
        },
        "-=100%",
      );
  });
});

/**
 * handle service worker
 */
!(async function handleServiceWorker(): Promise<void> {
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
})();

/**
 * polite console
 */
console.log(
  "%cThanks for visiting!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
