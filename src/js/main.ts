import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { config } from "./config.ts";
import { createAudio } from "./audio.ts";
import { playIntro } from "./intro.ts";
import { buildPanels, loadFont, type Panel } from "./panels.ts";
import { createRustle, step, type Pointer } from "./rustle.ts";
import { createScene } from "./scene.ts";
import { createSoundToggle } from "./toggle.ts";

gsap.registerPlugin(Observer);

const canvas = document.querySelector("canvas");
const button = document.querySelector<HTMLButtonElement>("button.sound");

if (canvas && button) {
  const scene = createScene(canvas);
  const audio = createAudio();
  const toggle = createSoundToggle(button, config.color.palette, (on) =>
    on ? void audio.enable() : audio.disable(),
  );
  const showToggle = () =>
    void gsap.to(button, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
  // eslint-disable-next-line functional/no-let
  let panels: readonly Panel[] = [];
  // eslint-disable-next-line functional/no-let
  let rustle = createRustle([]);
  // eslint-disable-next-line functional/no-let
  let intro: gsap.core.Tween | undefined;
  // eslint-disable-next-line functional/no-let
  let pointer: Pointer | null = null;
  // eslint-disable-next-line functional/no-let
  let reduced = false;
  // eslint-disable-next-line functional/no-let
  let swayPhase = 0;
  // eslint-disable-next-line functional/no-let
  let swayAmp = 0;

  const rebuild = () => {
    intro?.progress(1).kill();
    panels = buildPanels(config);
    scene.build(panels, config);
    rustle = createRustle(panels);
  };
  const update = () => {
    scene.update(config);
    toggle.layout(scene.axes());
  };
  const resize = () => {
    scene.resize(config);
    toggle.layout(scene.axes());
  };
  const replay = () => {
    intro?.kill();
    if (reduced) return;
    intro = playIntro(panels, scene.getRise(), scene.commitRise, config);
    void intro.then(showToggle);
  };

  const track = (self: Observer) => {
    pointer = reduced ? null : scene.toWord(self.x ?? 0, self.y ?? 0);
  };
  const leave = () => {
    pointer = null;
  };

  const tick = (_time: number, deltaMs: number) => {
    const dt = deltaMs / 1000;
    const { sway } = config;
    // ease between normal and reduced Sway so switching modes never jumps
    const amp = reduced ? sway.reducedAmplitude : sway.amplitude;
    swayAmp += (amp - swayAmp) * Math.min(1, dt * 2);
    swayPhase += dt * (reduced ? sway.reducedSpeed : sway.speed) * Math.PI * 2;
    scene.setSway(swayAmp, swayPhase);

    const wasMoving = rustle.moving;
    const crossed = step(rustle, pointer, dt, config);
    if (toggle.isOn() && crossed.length) {
      // spread a frame's Flicks across the frame so fast swipes don't stack into one click
      const peak = crossed.reduce(
        (max, c, i) =>
          Math.max(
            max,
            audio.flick(c.speed, config, (i / crossed.length) * dt),
          ),
        0,
      );
      if (peak > 0) toggle.bump(peak);
    }
    if (rustle.moving || wasMoving) {
      const bend = scene.getBend();
      rustle.column.forEach((c, i) => {
        bend[i * 2] = rustle.angle[c];
        bend[i * 2 + 1] = rustle.bend[c];
      });
      scene.commitBend();
    }
    scene.render();
  };

  void loadFont().then(() => {
    rebuild();
    resize();
    addEventListener("resize", resize);
    gsap.ticker.add(tick);
    gsap.matchMedia().add("(prefers-reduced-motion: reduce)", () => {
      reduced = true;
      pointer = null;
      intro?.progress(1).kill();
      // no Rustle means no Flicks, so the Sound toggle has nothing to switch
      toggle.turnOff();
      gsap.set(button, { autoAlpha: 0 });
      return () => {
        reduced = false;
        showToggle();
      };
    });
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
