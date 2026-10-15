/** Settled settings and color defaults. */
import type { Material, Scale } from "./chime.ts";

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
    /** tilt acceleration per unit of pointer speed; preserves the original 60 FPS feel */
    strength: 60,
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
  grain: {
    /** fine ink dropouts, 0..1 */
    amount: 0.1,
    /** broad patches of thinner ink, 0..1 */
    blotch: 0.01,
    /** light flecks in the ground, 0..1 */
    ground: 0.05,
    /** speckle size, CSS px */
    size: 1,
    /** re-rolls per second, 0 = still; always still under reduced motion */
    fps: 4,
  },
  chime: {
    material: "bamboo" as Material,
    scale: "hirajoshi" as Scale,
    /** frequency of the lowest note, Hz (D4) */
    root: 293.66,
    /** how many scale steps Panel lengths span: longest Panel rings the root */
    notes: 12,
    /** overall level, 0..1; each voice gets volume / voices, so even every voice at full strike sums to at most full scale */
    volume: 0.8,
    /** pointer speeds (cap heights per second) mapped to soft/mellow through loud/bright */
    minSpeed: 0.2,
    maxSpeed: 10,
    /** how much Rustle speed changes loudness: 0 = every Chime equal, 1 = soft to loud */
    dynamics: 0.25,
    /** seconds the strike takes to reach full volume; longer is softer */
    strike: 0.005,
    /** how long notes ring, as a multiple of the material's natural ring */
    ring: 2.5,
    /** level of the overtones, 0 = pure tone */
    brightness: 0.8,
    /** level of the strike's wooden knock, 0 = none; played densely it reads as crackle */
    knock: 0,
    /** random detune per partial, cents */
    detune: 6,
    /** reverb send level */
    reverb: 0.2,
    /** most notes ringing at once; past this the oldest gives way */
    voices: 12,
  },
  color: {
    seed: 517,
    runMin: 2,
    runMax: 4,
    /** chance a run uses the deep accent */
    accentChance: 0.05,
    /** back face brightness multiplier */
    backShade: 0.55,
    /** edge line width in px, 0 = off */
    edgeWidth: 0.5,
    edge: "#100F0F",
    background: "#100F0F",
    accent: "#71320D",
    palette: [
      "#FFE7CE",
      "#DFB431",
      "#CDD597",
      "#92BFDB",
      "#BFE8D9",
      "#FFE1D5",
      "#E1ECEB",
    ],
  },
};

export type Config = typeof defaults;

export const config: Config = structuredClone(defaults);
