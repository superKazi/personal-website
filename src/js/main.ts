import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { Observer } from "gsap/Observer";
import "instant.page";

/**
 * accessible animations
 */
gsap.registerPlugin(SplitText, Observer);
const mm = gsap.matchMedia();

document.fonts.ready.then(() => {
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    SplitText.create("h1", {
      type: "words, chars",
      wordsClass: "wrd",
      charsClass: "char",
    });
    SplitText.create("h2", {
      type: "words, chars",
      wordsClass: "wrd",
      charsClass: "char",
    });
    let splitLinks = SplitText.create("a", {
      type: "words, chars",
      wordsClass: "wrd",
      charsClass: "char",
    });

    gsap.set(".wrd", { pointerEvents: "none" });
    gsap.set(".char", { opacity: 0, yPercent: 100, pointerEvents: "none" });
    gsap.set("header, ul[role='list']", { opacity: 1 });

    let tl = gsap.timeline();

    tl.to("b", {
      scaleX: 1,
      duration: 1,
      ease: "expo.inOut",
    })
      .to(
        "header .char",
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.2,
          ease: "sine.out",
          stagger: 0.015,
        },
        "<40%",
      )
      .to(
        "ul[role='list'] .char",
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.3,
          ease: "sine.out",
          stagger: {
            each: 0.0025,
            ease: "sine",
          },
        },
        "<60%",
      );

    splitLinks.elements.forEach((elem) => {
      let q = gsap.utils.selector(elem);
      let chars = q(".char");
      let xTweens = chars.map((char) => {
        let radius =
          Math.random() < 0.35
            ? gsap.utils.random(20, 40)
            : gsap.utils.random(10, 20);
        let xTween = gsap.to(char, {
          paused: true,
          x: `+=${Math.PI * 2}`,
          repeat: -1,
          ease: "none",
          duration: () => gsap.utils.random(1, 3),
          modifiers: {
            x: gsap.utils.unitize((x: number) => Math.cos(x) * radius),
          },
        });
        return xTween;
      });
      let yTweens = chars.map((char) => {
        let radius =
          Math.random() < 0.35
            ? gsap.utils.random(20, 40)
            : gsap.utils.random(10, 20);

        let yTween = gsap.to(char, {
          paused: true,
          y: `+=${Math.PI * 2}`,
          repeat: -1,
          ease: "none",
          duration: () => gsap.utils.random(1, 3),
          modifiers: {
            y: gsap.utils.unitize((y: number) => Math.sin(y) * radius),
          },
        });
        return yTween;
      });

      Observer.create({
        target: elem,
        type: "pointer",
        onHover: () => {
          if (Observer.isTouch !== 1) {
            xTweens.forEach((tween) => tween.restart());
            yTweens.forEach((tween) => tween.restart());
          }
        },
        onHoverEnd: () => {
          if (Observer.isTouch !== 1) {
            xTweens.forEach((tween) => tween.pause());
            yTweens.forEach((tween) => tween.pause());

            chars.forEach((char) => {
              gsap.to(char, {
                x: 0,
                y: 0,
                duration: 0.2,
                ease: "power2.out",
              });
            });
          }
        },
      });
    });
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
