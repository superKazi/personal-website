import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { config } from "./config.ts";
import { playIntro } from "./intro.ts";
import { buildPanels, loadFont, type Panel } from "./panels.ts";
import { createRustle, step, type Pointer } from "./rustle.ts";
import { createScene } from "./scene.ts";

gsap.registerPlugin(Observer);

const canvas = document.querySelector("canvas");

if (canvas) {
  const scene = createScene(canvas);
  // eslint-disable-next-line functional/no-let
  let panels: readonly Panel[] = [];
  // eslint-disable-next-line functional/no-let
  let rustle = createRustle([]);
  // eslint-disable-next-line functional/no-let
  let intro: gsap.core.Tween | undefined;
  // eslint-disable-next-line functional/no-let
  let pointer: Pointer | null = null;

  const rebuild = () => {
    intro?.progress(1).kill();
    panels = buildPanels(config);
    scene.build(panels, config);
    rustle = createRustle(panels);
  };
  const update = () => scene.update(config);
  const replay = () => {
    intro?.kill();
    intro = playIntro(panels, scene.getRise(), scene.commitRise, config);
  };

  const track = (self: Observer) => {
    pointer = scene.toWord(self.x ?? 0, self.y ?? 0);
  };
  const leave = () => {
    pointer = null;
  };

  const tick = (_time: number, deltaMs: number) => {
    const wasMoving = rustle.moving;
    step(rustle, pointer, deltaMs / 1000, config);
    if (rustle.moving || wasMoving) {
      const bend = scene.getBend();
      rustle.column.forEach((c, i) => {
        bend[i * 3] = rustle.angle[c];
        bend[i * 3 + 1] = rustle.height[c];
        bend[i * 3 + 2] = rustle.top[c];
      });
      scene.commitBend();
    }
    scene.render();
  };

  void loadFont().then(() => {
    rebuild();
    scene.resize(config);
    addEventListener("resize", () => scene.resize(config));
    gsap.ticker.add(tick);
    replay();

    Observer.create({
      target: canvas,
      type: "pointer,touch",
      onMove: track,
      onPress: track,
      onDrag: track,
      onRelease: leave,
      onHoverEnd: leave,
    });

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
