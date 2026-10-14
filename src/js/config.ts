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
    duration: 1.8,
    /** seconds between the first and last Panel starting */
    stagger: 1,
    ease: "elastic.out(1,0.75)",
    /** how far below rest Panels start, in cap heights */
    distance: 0.55,
    /** 0 = movement only, 1 = full fade from transparent */
    fade: 1,
  },
  rustle: {
    /** spring pulling each column upright */
    stiffness: 120,
    damping: 5,
    /** pull toward neighbouring columns, 0 = independent */
    coupling: 15,
    /** tilt velocity per unit of pointer speed */
    strength: 1,
    /** pointer reach along the word, in cap heights */
    radius: 0.2,
    /** how far past a sheet's edges the pointer still reaches, in cap heights */
    margin: 0,
    /** radians */
    maxAngle: 0.25,
    /** 0 = even curve, 1 = all bend at the pointer's depth */
    bendSharpness: 0.5,
    /** width of the bend zone, as a fraction of the depth */
    bendWidth: 0.5,
  },
  sway: {
    /** tilt in radians */
    amplitude: 0.06,
    /** cycles per second */
    speed: 0.15,
    /** phase shift along the word, per cap height */
    wave: 1.5,
    /** used when the visitor prefers reduced motion */
    reducedAmplitude: 0.03,
    reducedSpeed: 0.07,
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
