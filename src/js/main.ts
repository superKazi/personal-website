import { gsap } from "gsap";
import { SplitText } from "gsap/SplitText";
import { Observer } from "gsap/Observer";

/**
 * accessible animations
 */
gsap.registerPlugin(SplitText, Observer);
const mm = gsap.matchMedia();

void document.fonts.ready.then(() => {
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    const opts = {
      type: "words, chars",
      mask: "words" as const,
      wordsClass: "wrd",
      charsClass: "char",
    };
    SplitText.create("h1, h2", opts);
    const splitLinks = SplitText.create("a", opts);

    gsap.set(".wrd", { pointerEvents: "none", opacity: 0, yPercent: 100 });
    gsap.set(".wrd-mask, .char", { pointerEvents: "none" });
    gsap.set("header, ul[role='list']", { opacity: 1 });

    const tl = gsap.timeline({ paused: true });

    const seenAnimation = (() => {
      try {
        return localStorage.getItem("seenAnimation");
      } catch {
        console.error(
          "storage unavailable (privacy mode, blocked storage, etc.)",
        );
        return null;
      }
    })();

    tl.to("b", {
      scaleX: 1,
      duration: 1,
      ease: "expo.inOut",
    })
      .to(
        "header .wrd",
        {
          opacity: 1,
          yPercent: 0,
          duration: 1,
          ease: "circ.out",
          stagger: 0.05,
        },
        "<40%",
      )
      .to(
        "ul[role='list'] .wrd",
        {
          opacity: 1,
          yPercent: 0,
          duration: 0.8,
          ease: "circ.out",
          stagger: {
            each: 0.02,
            ease: "sine",
          },
        },
        "<40%",
      );

    if (!seenAnimation || Date.now() - Number(seenAnimation) > 86400000) {
      try {
        localStorage.setItem("seenAnimation", String(Date.now()));
      } catch {
        console.error(
          "storage unavailable (privacy mode, blocked storage, etc.)",
        );
      }
      tl.play();
    } else {
      tl.progress(1);
    }

    splitLinks.elements.forEach((elem) => {
      const q = gsap.utils.selector(elem);
      const chars = q(".char");
      const radius = () => gsap.utils.random(1, 4);
      const tweens = chars.map((char) => {
        const rx = radius(),
          ry = radius();
        return gsap.to(char, {
          paused: true,
          x: `+=${Math.PI * 2}`,
          y: `+=${Math.PI * 2}`,
          repeat: -1,
          ease: "none",
          duration: () => gsap.utils.random(1, 3),
          modifiers: {
            x: gsap.utils.unitize((x: number) => Math.cos(x) * rx),
            y: gsap.utils.unitize((y: number) => Math.sin(y) * ry),
          },
        });
      });

      Observer.create({
        target: elem,
        type: "pointer",
        onHover: () => {
          if (Observer.isTouch !== 1) {
            tweens.forEach((tween) => void tween.restart());
          }
        },
        onHoverEnd: () => {
          if (Observer.isTouch !== 1) {
            tweens.forEach((tween) => void tween.pause());

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
 * polite console
 */
console.log(
  "%cThanks for visiting!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
