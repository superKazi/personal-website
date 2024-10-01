import { gsap } from "gsap";
import Splitting from "splitting";

const mm = gsap.matchMedia();

mm.add("(prefers-reduced-motion: no-preference)", () => {
  Splitting();

  const tl = gsap.timeline();

  tl.set(".char", {
    display: "inline-block",
    yPercent: -90,
  })
    .to(".screen", {
      scaleY: 1,
      duration: 2.5,
      ease: "expo.out",
    })
    .to(
      ".char",
      {
        opacity: 1,
        yPercent: 0,
        stagger: 0.15,
        duration: 1.8,
        ease: "elastic.out(1.1, 0.5)",
      },
      "<50%",
    )
    .to(
      "main, body",
      {
        background: "#0d0d0d",
        duration: 1,
        ease: "none",
      },
      "<",
    )
    .to(
      "p",
      {
        opacity: 1,
        filter: "blur(0px)",
        duration: 1,
        ease: "none",
      },
      "<35%",
    );
});

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
const politeString =
  document.documentElement.dataset.city === "unknown"
    ? `%cThanks for checking out my site!`
    : `%cThanks for checking out my site all the way from ${document.documentElement.dataset.city}!`;

console.log(
  politeString,
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
