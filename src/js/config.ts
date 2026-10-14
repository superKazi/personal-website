/**
 * Every tunable in one place. In dev, lil-gui edits a copy and its export
 * button produces JSON to paste over these defaults.
 */
export const defaults = {
  view: {
    /** degrees */
    yaw: 35,
    pitch: -30,
    roll: 55,
    /** fraction of the viewport kept clear around the word */
    padding: 0.05,
  },
  panels: {
    /** Panels per cap height */
    density: 25,
    /** Panel depth, in cap heights */
    depth: 0.9,
    /** gap between Stacks, in cap heights */
    tracking: 0.05,
  },
  intro: {
    /** seconds each Panel takes to rise */
    duration: 0.9,
    /** seconds between the first and last Panel starting */
    stagger: 0.6,
    ease: "back.out(1.6)",
    /** how far below rest Panels start, in cap heights */
    distance: 1.2,
    /** 0 = movement only, 1 = full fade from transparent */
    fade: 0,
  },
  color: {
    seed: 475,
    runMin: 2,
    runMax: 5,
    /** chance a run uses the deep accent */
    accentChance: 0.08,
    /** back face brightness multiplier */
    backShade: 0.8,
    /** edge line width in px, 0 = off */
    edgeWidth: 1,
    edge: "#100F0F",
    background: "#100F0F",
    accent: "#9D4310",
    palette: [
      "#FED3AF",
      "#F6E2A0",
      "#CDD597",
      "#A2DECE",
      "#ABCFE2",
      "#FCCFDA",
      "#C6DDE8",
    ],
  },
};

export type Config = typeof defaults;

export const config: Config = structuredClone(defaults);
