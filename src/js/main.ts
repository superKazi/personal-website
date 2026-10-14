import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { config } from "./config.ts";
import { createAudio } from "./audio.ts";
import { frequency, noteForLength } from "./chime.ts";
import { playIntro } from "./intro.ts";
import { buildPanels, loadFont, type Panel } from "./panels.ts";
import { createRustle, step, type Pointer } from "./rustle.ts";
import { createScene } from "./scene.ts";
import { createSoundToggle } from "./toggle.ts";
import { createVelocity } from "./velocity.ts";

gsap.registerPlugin(Observer);

const canvas = document.querySelector("canvas");
const button = document.querySelector<HTMLButtonElement>("button.sound");

if (canvas && button) {
  const scene = createScene(canvas);
  const audio = createAudio();
  const toggle = createSoundToggle(button, config.color.palette, (on) =>
    on ? void audio.enable(config) : audio.disable(),
  );
  const showToggle = () =>
    void gsap.to(button, { autoAlpha: 1, duration: 0.6, ease: "power2.out" });
  // eslint-disable-next-line functional/no-let
  let panels: readonly Panel[] = [];
  // eslint-disable-next-line functional/no-let
  let rustle = createRustle([]);
  // eslint-disable-next-line functional/no-let
  let intro: gsap.core.Tween | undefined;
  // where the pointer is on screen, null when it's away, and its velocity from event timestamps
  // eslint-disable-next-line functional/no-let
  let client: Readonly<{ x: number; y: number }> | null = null;
  const velocity = createVelocity();
  // eslint-disable-next-line functional/no-let
  let lengths = { min: 0, max: 0 };
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
    lengths = {
      min: Math.min(...rustle.length),
      max: Math.max(...rustle.length),
    };
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
    client = reduced ? null : { x: self.x ?? 0, y: self.y ?? 0 };
    if (client)
      velocity.add(
        self.event?.timeStamp ?? performance.now(),
        client.x,
        client.y,
      );
  };
  const leave = () => {
    client = null;
    velocity.clear();
  };
  /** The pointer ray in word space, with its velocity projected onto the word. */
  const pointerNow = (): Pointer | null => {
    if (!client) return null;
    const ray = scene.toWord(client.x, client.y);
    if (!ray) return null;
    const v = velocity.at(performance.now());
    const h = 0.01;
    const ahead = scene.toWord(client.x + v.x * h, client.y + v.y * h);
    return { ...ray, vx: ahead ? (ahead.x - ray.x) / h : 0 };
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
    const crossed = step(rustle, pointerNow(), dt, config);
    if (toggle.isOn() && crossed.length) {
      const { chime } = config;
      // every Panel is a chime: each one crossed plays its own note, set by its length
      crossed.forEach((c, i) => {
        const note = noteForLength(
          rustle.length[c.column],
          lengths.min,
          lengths.max,
          chime.notes,
        );
        const s = Math.min(
          1,
          Math.max(
            0,
            (c.speed - chime.minSpeed) / (chime.maxSpeed - chime.minSpeed),
          ),
        );
        const freq = frequency(note, chime.root, chime.scale);
        // spread a frame's Chimes across the frame so a fast swipe plays a run, not a chord
        if (audio.chime(note, freq, s, config, (i / crossed.length) * dt))
          toggle.bump(0.4 + 0.6 * s, note / Math.max(1, chime.notes - 1));
      });
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
      client = null;
      intro?.progress(1).kill();
      // no Rustle means no Chimes, so the Sound toggle has nothing to switch
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
        createGui(
          config,
          () => void loadFont().then(rebuild),
          update,
          replay,
          () => audio.mix(config),
        ),
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
