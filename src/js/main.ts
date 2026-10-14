import { gsap } from "gsap";
import { config } from "./config.ts";
import { playIntro } from "./intro.ts";
import { buildPanels, loadFont, type Panel } from "./panels.ts";
import { createScene } from "./scene.ts";

const canvas = document.querySelector("canvas");

if (canvas) {
  const scene = createScene(canvas);
  // eslint-disable-next-line functional/no-let
  let panels: readonly Panel[] = [];
  // eslint-disable-next-line functional/no-let
  let intro: gsap.core.Tween | undefined;

  const rebuild = () => {
    intro?.progress(1).kill();
    panels = buildPanels(config);
    scene.build(panels, config);
  };
  const update = () => scene.update(config);
  const replay = () => {
    intro?.kill();
    intro = playIntro(panels, scene.getRise(), scene.commitRise, config);
  };

  void loadFont().then(() => {
    rebuild();
    scene.resize(config);
    addEventListener("resize", () => scene.resize(config));
    gsap.ticker.add(scene.render);
    replay();

    if (import.meta.env.DEV) {
      void import("./gui.ts").then(({ createGui }) =>
        // lil-gui's stylesheet resets CSS font faces, so reload Degular before re-slicing
        createGui(config, () => void loadFont().then(rebuild), update, replay),
      );
    }
  });
}

/**
 * polite console
 */
console.log(
  "%cThanks for visiting!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
