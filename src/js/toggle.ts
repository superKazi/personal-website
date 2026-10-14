import { gsap } from "gsap";

type Axis = readonly [number, number, number];

const BARS = 7;
const SIZE = 24; // drawing box, px
const OFF = "#6F6E69"; // Flexoki base-600

/**
 * The Sound toggle: a tiny Stack of bars drawn at the piece's angle.
 * On, the bars ripple like a waveform in Panel colors; off, they sit flat and gray.
 */
export const createSoundToggle = (
  button: HTMLButtonElement,
  palette: readonly string[],
  onChange: (on: boolean) => void,
) => {
  const svg =
    button.querySelector("svg") ??
    button.appendChild(
      document.createElementNS("http://www.w3.org/2000/svg", "svg"),
    );
  const bars = Array.from({ length: BARS }, () => {
    const p = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
    svg.append(p);
    return p;
  });
  // 0 = off, 1 = on; tweened so color and ripple ease between states
  const state = { on: 0, phase: 0 };
  // per-bar kick from Chimes, decaying every frame
  const bumps = new Float32Array(BARS);
  // eslint-disable-next-line functional/no-let
  let axes: readonly Axis[] = [
    [1, 0, 0],
    [0, -1, 0],
    [0, 0, 1],
  ];

  const draw = () => {
    const [x, y, z] = axes;
    const gap = 1.1;
    const depth = 3;
    const corners = (i: number, h: number) => {
      const ox = x[0] * i * gap;
      const oy = x[1] * i * gap;
      return [
        [ox, oy],
        [ox + z[0] * depth, oy + z[1] * depth],
        [ox + z[0] * depth + y[0] * h, oy + z[1] * depth + y[1] * h],
        [ox + y[0] * h, oy + y[1] * h],
      ];
    };
    // centre a mid-height Stack in the box; taller ripples overflow visibly
    const extent = Array.from({ length: BARS }, (_, i) => corners(i, 4)).flat();
    const xs = extent.map((c) => c[0]);
    const ys = extent.map((c) => c[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const scale =
      SIZE / Math.max(Math.max(...xs) - minX, Math.max(...ys) - minY);
    const offX = (SIZE - (Math.max(...xs) - minX) * scale) / 2;
    const offY = (SIZE - (Math.max(...ys) - minY) * scale) / 2;

    bars.forEach((bar, i) => {
      const wave = 0.5 + 0.5 * Math.sin(state.phase + i * 0.9);
      const level = 0.35 + 0.65 * (state.on * (0.25 + 0.6 * wave) + bumps[i]);
      const h = 6 * Math.min(1, level);
      bar.setAttribute(
        "points",
        corners(i, h)
          .map(
            ([cx, cy]) =>
              `${((cx - minX) * scale + offX).toFixed(2)},${((cy - minY) * scale + offY).toFixed(2)}`,
          )
          .join(" "),
      );
      bar.setAttribute(
        "fill",
        gsap.utils.interpolate(OFF, palette[i % palette.length], state.on),
      );
    });
  };

  // eslint-disable-next-line functional/no-let
  let on = false;
  gsap.ticker.add((_t, deltaMs) => {
    const dt = deltaMs / 1000;
    // eslint-disable-next-line functional/no-let
    let kicked = false;
    for (let i = 0; i < BARS; i++) {
      bumps[i] = bumps[i] < 0.001 ? 0 : bumps[i] * Math.exp(-dt * 7);
      kicked ||= bumps[i] > 0;
    }
    // a still, off toggle needs no redraw
    if (state.on === 0 && !kicked && !on) return;
    state.phase += dt * 2.4;
    draw();
  });

  button.addEventListener("click", () => {
    on = !on;
    // the label states the action, so there's no aria-pressed to announce the state twice
    const label = button.querySelector(".visually-hidden");
    if (label) label.textContent = `Turn ${on ? "off" : "on"} audio experience`;
    gsap.to(state, {
      on: on ? 1 : 0,
      duration: 0.5,
      ease: "power2.inOut",
      onUpdate: draw,
    });
    onChange(on);
  });

  return {
    /** Re-slant the bars to match the piece's current view. */
    layout: (next: readonly Axis[]) => {
      axes = next;
      // draw the bar nearest the viewer last; only here, since moving nodes mid-click drops the click
      (axes[0][2] >= 0 ? bars : [...bars].reverse()).forEach((bar) =>
        svg.append(bar),
      );
      draw();
    },
    /** Kick the bar at `at` (0 = first, 1 = last) and a little of its neighbours, e.g. when a Chime plays. */
    bump: (amount: number, at: number) => {
      const centre = at * (BARS - 1);
      for (let i = 0; i < BARS; i++) {
        const near = Math.max(0, 1 - Math.abs(i - centre) / 1.5);
        bumps[i] = Math.min(1, bumps[i] + amount * near * 0.6);
      }
    },
    isOn: () => on,
    turnOff: () => {
      if (on) button.click();
    },
  };
};
