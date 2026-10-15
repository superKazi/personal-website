import { gsap } from "gsap";
import { config } from "./config.ts";
import type { Panel } from "./panels.ts";
import type { Pointer } from "./rustle.ts";

type Ray = Omit<Pointer, "vx" | "source">;

const SWEEP_SECONDS = 1.4;

/**
 * What drives Rustle: the visitor's pointer, or the keyboard sweep along the word from the
 * "Rustle panels" button. Feed the pointer in with `track` and `leave`; read it once per frame with `now`.
 */
export const createPointer = ({
  button,
  panels,
  toWord,
  velocity,
}: Readonly<{
  button: HTMLButtonElement | null;
  /** in order along the word */
  panels: readonly Pick<Panel, "x">[];
  /** screen point to a ray in word space, or null if it can't meet the word */
  toWord: (x: number, y: number) => Ray | null;
  /** the pointer's screen velocity in px/s, read each frame since it decays while the pointer rests */
  velocity: () => readonly [number, number];
}>) => {
  // eslint-disable-next-line functional/no-let
  let client: Readonly<{ x: number; y: number }> | null = null;
  // eslint-disable-next-line functional/no-let
  let keyboard: Pointer | null = null;
  // Rustle only counts crossings between frames from the same source, so the sweep reports
  // its start before it moves and its end before it hands back, or the first and last Panels go unplayed
  // eslint-disable-next-line functional/no-let
  let phase: "start" | "moving" | "end" = "start";
  // eslint-disable-next-line functional/no-let
  let reduced = false;
  const first = panels[0].x - 0.04;
  const last = panels[panels.length - 1].x + 0.04;

  button?.addEventListener("click", () => {
    if (reduced || keyboard) return;
    keyboard = {
      x: first,
      y: 0.5,
      z: config.panels.depth / 2,
      slopeY: 0,
      slopeZ: 0,
      vx: (last - first) / SWEEP_SECONDS,
      source: "keyboard",
    };
    phase = "start";
  });

  /** The keyboard sweep, or else the pointer ray with its velocity projected onto the word. */
  const now = (): Pointer | null => {
    if (reduced) return null;
    if (keyboard) {
      const sweep = keyboard;
      if (phase === "start") {
        phase = "moving";
        void gsap.to(sweep, {
          x: last,
          duration: SWEEP_SECONDS,
          ease: "none",
          onComplete: () => {
            phase = "end";
          },
        });
      } else if (phase === "end") keyboard = null;
      return sweep;
    }
    if (!client) return null;
    const ray = toWord(client.x, client.y);
    if (!ray) return null;
    const h = 0.01;
    const [vx, vy] = velocity();
    const ahead = toWord(client.x + vx * h, client.y + vy * h);
    return {
      ...ray,
      vx: ahead ? (ahead.x - ray.x) / h : 0,
      source: "pointer",
    };
  };

  return {
    now,
    /** The pointer is at this screen point. */
    track: (x: number, y: number) => {
      client = reduced ? null : { x, y };
    },
    /** The pointer lifted or left. */
    leave: () => {
      client = null;
    },
    /** Reduced motion: no Rustle at all, and no button to start one. */
    setReduced: (on: boolean) => {
      reduced = on;
      client = null;
      if (keyboard) gsap.killTweensOf(keyboard);
      keyboard = null;
      if (button) button.hidden = on;
    },
  };
};
