import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { config } from "./config.ts";
import { createAudio } from "./audio.ts";
import { playIntro } from "./intro.ts";
import { buildPanels, loadFont } from "./panels.ts";
import { createRustle, step, type Pointer } from "./rustle.ts";
import { createScene } from "./scene.ts";
import { createSoundToggle } from "./toggle.ts";

gsap.registerPlugin(Observer);

const canvas = document.querySelector("canvas");
const button = document.querySelector<HTMLButtonElement>("button.sound");
const byline = document.querySelector(".byline");

const start = async () => {
  if (!canvas || !button || !byline) return;
  await loadFont();
  const scene = createScene(canvas);
  // a lost GPU context never draws again; the piece keeps no state, so reload once it's back
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => location.reload());
  const panels = buildPanels();
  const audio = createAudio(panels, config);
  const toggle = createSoundToggle(button, config.color.palette, (on) =>
    on ? audio.enable() : audio.disable(),
  );
  const showToggle = () =>
    void gsap.to([button, byline], {
      autoAlpha: 1,
      duration: 0.6,
      ease: "power2.out",
    });
  scene.build(panels);
  const rustle = createRustle(panels, config);
  // Panel of each scene instance, one per piece
  const owner = panels.flatMap((p, i) => p.pieces.map(() => i));
  // eslint-disable-next-line functional/no-let
  let intro: gsap.core.Tween | undefined;
  // where the pointer is on screen, null when it's away, and the Observer tracking its velocity
  // eslint-disable-next-line functional/no-let
  let client: Readonly<{ x: number; y: number }> | null = null;
  // eslint-disable-next-line functional/no-let
  let reduced = false;
  // eslint-disable-next-line functional/no-let
  let swayPhase = 0;
  // eslint-disable-next-line functional/no-let
  let swayAmp = 0;
  // eslint-disable-next-line functional/no-let
  let grainClock = 0;
  const keyboardButton =
    document.querySelector<HTMLButtonElement>(".rustle-keyboard");
  // eslint-disable-next-line functional/no-let
  let keyboard: Pointer | null = null;

  const resize = () => {
    scene.resize();
    toggle.layout(scene.axes());
  };

  const track = (self: Observer) => {
    client = reduced ? null : { x: self.x ?? 0, y: self.y ?? 0 };
  };
  const leave = () => {
    client = null;
  };
  const observer = Observer.create({
    target: canvas,
    type: "pointer,touch",
    onMove: track,
    onPress: track,
    onDrag: track,
    onRelease: leave,
    onHoverEnd: leave,
  });
  /** The pointer ray in word space, with Observer's velocity projected onto the word. */
  const pointerNow = (): Pointer | null => {
    if (reduced) return null;
    if (keyboard) return keyboard;
    if (!client) return null;
    const ray = scene.toWord(client.x, client.y);
    if (!ray) return null;
    const h = 0.01;
    const ahead = scene.toWord(
      client.x + observer.velocityX * h,
      client.y + observer.velocityY * h,
    );
    return {
      ...ray,
      vx: ahead ? (ahead.x - ray.x) / h : 0,
      source: "pointer",
    };
  };

  const tick = (_time: number, deltaMs: number) => {
    const dt = deltaMs / 1000;
    const { sway } = config;
    // ease between normal and reduced Sway so switching modes never jumps
    const amp = reduced ? sway.reducedAmplitude : sway.amplitude;
    swayAmp += (amp - swayAmp) * Math.min(1, dt * 2);
    swayPhase += dt * (reduced ? sway.reducedSpeed : sway.speed) * Math.PI * 2;
    scene.setSway(swayAmp, swayPhase);
    // Grain re-rolls in steps, like a hand-made print, and holds still under reduced motion
    if (!reduced) grainClock += dt;
    scene.setGrain(Math.floor(grainClock * config.grain.fps));

    const wasMoving = rustle.moving;
    const crossed = step(rustle, pointerNow(), dt);
    if (toggle.isOn() && crossed.length)
      audio
        .play(crossed, dt)
        .forEach(({ strength, scalePosition }) =>
          toggle.bump(0.4 + 0.6 * strength, scalePosition),
        );
    if (rustle.moving || wasMoving) {
      const bend = scene.getBend();
      owner.forEach((c, i) => {
        bend[i * 2] = rustle.angle[c];
        bend[i * 2 + 1] = rustle.bend[c];
      });
      scene.commitBend();
    }
    scene.render();
  };

  resize();
  document.body.classList.add("ready");
  keyboardButton?.addEventListener("click", () => {
    if (reduced || keyboard) return;
    const first = panels[0].x - 0.04;
    const last = panels[panels.length - 1].x + 0.04;
    keyboard = {
      x: first,
      y: 0.5,
      z: config.panels.depth / 2,
      slopeY: 0,
      slopeZ: 0,
      vx: (last - first) / 1.4,
      source: "keyboard",
    };
    rustle.prev = { ...keyboard };
    void gsap.to(keyboard, {
      x: last,
      duration: 1.4,
      ease: "none",
      onComplete: () => {
        keyboard = null;
      },
    });
  });
  addEventListener("resize", resize);
  gsap.ticker.add(tick);
  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", (ctx) => {
    reduced = true;
    client = null;
    if (keyboard) gsap.killTweensOf(keyboard);
    keyboard = null;
    if (keyboardButton) keyboardButton.hidden = true;
    intro?.progress(1).kill();
    // no Rustle means no Chimes, so the Sound toggle has nothing to switch;
    // ignored so leaving reduced motion doesn't revert the toggle's look back to on
    ctx.ignore(() => toggle.turnOff());
    // overwrite stops the intro's just-fired fade-in from revealing the button again
    gsap.set(button, { autoAlpha: 0, overwrite: true });
    // the Byline still shows without the intro; ignored so leaving reduced motion keeps it
    ctx.ignore(() => gsap.set(byline, { autoAlpha: 1, overwrite: true }));
    return () => {
      reduced = false;
      if (keyboardButton) keyboardButton.hidden = false;
      showToggle();
    };
  });
  if (!reduced) {
    intro = playIntro(panels, scene.getRise(), scene.commitRise);
    void intro.then(showToggle);
  }
};

void start().catch((error: unknown) => {
  document.body.classList.remove("ready");
  document.body.classList.add("failed");
  if (byline) gsap.set(byline, { autoAlpha: 1 });
  if (button) gsap.set(button, { autoAlpha: 0 });
  console.error("Artwork unavailable", error);
});

/**
 * polite console
 */
console.log(
  "%cThanks for visiting!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
