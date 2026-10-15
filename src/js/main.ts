import { gsap } from "gsap";
import { Observer } from "gsap/Observer";
import { config } from "./config.ts";
import { createAudio } from "./audio.ts";
import { playIntro } from "./intro.ts";
import { buildPanels, loadFont } from "./panels.ts";
import { createPointer } from "./pointer.ts";
import { createRustle, step } from "./rustle.ts";
import { createScene } from "./scene.ts";
import { createSoundToggle } from "./toggle.ts";

gsap.registerPlugin(Observer);

const canvas = document.querySelector("canvas");
const button = document.querySelector<HTMLButtonElement>("button.sound");
const byline = document.querySelector(".byline");

const start = async () => {
  if (!canvas || !button || !byline) return;
  await loadFont();
  const panels = buildPanels();
  const scene = createScene(canvas, panels);
  // a lost GPU context never draws again; the piece keeps no state, so reload once it's back
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault());
  canvas.addEventListener("webglcontextrestored", () => location.reload());
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
  const rustle = createRustle(panels, config);
  // eslint-disable-next-line functional/no-let
  let intro: gsap.core.Tween | undefined;
  // eslint-disable-next-line functional/no-let
  let reduced = false;

  const resize = () => {
    scene.resize();
    toggle.layout(scene.axes());
  };

  const track = (self: Observer) => pointer.track(self.x ?? 0, self.y ?? 0);
  const leave = () => pointer.leave();
  const observer = Observer.create({
    target: canvas,
    type: "pointer,touch",
    onMove: track,
    onPress: track,
    onDrag: track,
    onRelease: leave,
    onHoverEnd: leave,
  });
  const pointer = createPointer({
    button: document.querySelector<HTMLButtonElement>(".rustle-keyboard"),
    panels,
    toWord: scene.toWord,
    velocity: () => [observer.velocityX, observer.velocityY],
  });

  const tick = (_time: number, deltaMs: number) => {
    const dt = deltaMs / 1000;
    const crossed = step(rustle, pointer.now(), dt);
    if (toggle.isOn() && crossed.length)
      audio
        .play(crossed, dt)
        .forEach(({ strength, scalePosition }) =>
          toggle.bump(0.4 + 0.6 * strength, scalePosition),
        );
    scene.setRustle(rustle.angle, rustle.bend);
    scene.render(dt, reduced);
  };

  resize();
  document.body.classList.add("ready");
  addEventListener("resize", resize);
  gsap.ticker.add(tick);
  gsap.matchMedia().add("(prefers-reduced-motion: reduce)", (ctx) => {
    reduced = true;
    pointer.setReduced(true);
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
      pointer.setReduced(false);
      showToggle();
    };
  });
  if (!reduced) {
    intro = playIntro(panels, scene.setRise);
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
  "%cThanks for visiting! If you like the design you'll dig Igarashi Takenobu!",
  `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
  "Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
);
