import {
  Camera,
  Color,
  Mat4,
  Mesh,
  Plane,
  Program,
  Renderer,
  Transform,
  Triangle,
  Vec3,
} from "ogl";
import { config } from "./config.ts";
import type { Panel } from "./panels.ts";

const vertex = /* glsl */ `#version 300 es
in vec2 uv;
in vec3 aPanel; // x, y0, y1
in vec3 aColor;
in float aRise; // intro progress, 0 = hidden below, 1 = at rest
in vec2 aBend; // Rustle: tilt (radians), bend position along the depth (0 = Spine, 1 = free edge)
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform float uDepth;
uniform float uRiseDistance;
uniform float uBendSharpness;
uniform float uBendWidth;
uniform float uSwayAmp;
uniform float uSwayPhase;
uniform float uSwayWave;
out vec2 vUv;
out vec3 vColor;
out float vRise;
// share of the full tilt reached at depth u: even curve, or concentrated at the bend position
float profile(float u, float h) {
  return mix(u, smoothstep(h - uBendWidth, h + uBendWidth, u), uBendSharpness);
}
void main() {
  vUv = uv;
  vColor = aColor;
  vRise = aRise;
  // Panels stand in the y-z plane; uv.x runs along depth, uv.y up the height
  float y = mix(aPanel.y, aPanel.z, uv.y);
  // Sway: two slow waves travelling along the word, added on top of any Rustle
  float sway = uSwayAmp * (0.7 * sin(uSwayPhase + aPanel.x * uSwayWave)
    + 0.3 * sin(1.7 * uSwayPhase + aPanel.x * uSwayWave * 0.6 + 1.3));
  float tilt = aBend.x + sway;
  // walk out from the Spine (z = 0) so the sheet keeps its length as it bends
  float s = uv.x;
  vec2 q = vec2(0.0);
  for (int i = 0; i < 12; i++) {
    float phi = tilt * profile((float(i) + 0.5) / 12.0 * s, aBend.y);
    q += vec2(sin(phi), cos(phi));
  }
  q *= uDepth * s / 12.0;
  vec3 p = vec3(aPanel.x + q.x, y, q.y);
  p.y -= (1.0 - aRise) * uRiseDistance;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}`;

// Grain: screen-space ink speckle that re-rolls whenever uGrainSeed steps
const grain = /* glsl */ `
uniform float uGrainSize;
uniform float uGrainSeed;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float valueNoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
    mix(hash(i + vec2(0, 1)), hash(i + 1.0), f.x), f.y);
}
vec2 grainCell() {
  return floor(gl_FragCoord.xy / uGrainSize) + fract(uGrainSeed * 0.618034) * 997.0;
}`;

const fragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vColor;
in float vRise;
uniform float uFade;
uniform float uBackShade;
uniform float uEdgeWidth;
uniform vec3 uEdge;
uniform vec3 uBackground;
uniform float uGrainAmount;
uniform float uGrainBlotch;
out vec4 fragColor;
${grain}
void main() {
  // dithered fade keeps depth testing correct without sorting Panels
  float alpha = mix(1.0, clamp(vRise, 0.0, 1.0), uFade);
  float noise = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
  if (alpha < 1.0 && noise >= alpha) discard;
  vec3 color = gl_FrontFacing ? vColor : vColor * uBackShade;
  // distance to the nearest Panel edge, in screen pixels
  vec2 px = min(vUv, 1.0 - vUv) / fwidth(vUv);
  float edge = uEdgeWidth > 0.0
    ? 1.0 - smoothstep(uEdgeWidth - 0.5, uEdgeWidth + 0.5, min(px.x, px.y))
    : 0.0;
  color = mix(color, uEdge, edge);
  // ink that didn't take: fine dropouts plus broad patches of thinner ink, showing the ground through
  vec2 cell = grainCell();
  float drop = uGrainAmount * pow(hash(cell), 3.0)
    + uGrainBlotch * smoothstep(0.4, 1.0, valueNoise(cell / 48.0));
  fragColor = vec4(mix(color, uBackground, clamp(drop, 0.0, 1.0)), 1.0);
}`;

// full-screen triangle behind the Panels: the ground, with faint light flecks like dark stock
const groundVertex = /* glsl */ `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const groundFragment = /* glsl */ `#version 300 es
precision highp float;
uniform vec3 uBackground;
uniform float uGrainGround;
out vec4 fragColor;
${grain}
void main() {
  float fleck = uGrainGround * pow(hash(grainCell()), 12.0);
  fragColor = vec4(mix(uBackground, vec3(1.0), fleck), 1.0);
}`;

const rad = (deg: number) => (deg * Math.PI) / 180;

export const createScene = (
  canvas: HTMLCanvasElement,
  panels: readonly Panel[],
) => {
  if (
    !canvas.getContext("webgl2", {
      alpha: false,
      antialias: true,
      premultipliedAlpha: false,
    })
  ) {
    // eslint-disable-next-line functional/no-throw-statements -- leave the static page intact without WebGL 2
    throw new Error("WebGL 2 unavailable");
  }
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(devicePixelRatio, 3),
    antialias: true,
  });
  const { gl } = renderer;
  const camera = new Camera(gl, { near: -100, far: 100 });
  camera.orthographic({ left: -1, right: 1, top: 1, bottom: -1 });

  // nested single-axis rotations keep yaw → pitch → roll unambiguous
  const roll = new Transform();
  const pitch = new Transform();
  const yaw = new Transform();
  const center = new Transform();
  pitch.setParent(roll);
  yaw.setParent(pitch);
  center.setParent(yaw);

  const uniforms = {
    uDepth: { value: config.panels.depth },
    uRiseDistance: { value: config.intro.distance },
    uBendSharpness: { value: config.rustle.bendSharpness },
    uBendWidth: { value: config.rustle.bendWidth },
    uSwayAmp: { value: 0 },
    uSwayPhase: { value: 0 },
    uSwayWave: { value: config.sway.wave },
    uFade: { value: config.intro.fade },
    uBackShade: { value: config.color.backShade },
    // uEdgeWidth and uGrainSize are in device pixels, so `resize` sets them
    uEdgeWidth: { value: 1 },
    uEdge: { value: new Color(config.color.edge) },
    uBackground: { value: new Color(config.color.background) },
    uGrainSize: { value: 1 },
    uGrainSeed: { value: 0 },
    uGrainAmount: { value: config.grain.amount },
    uGrainBlotch: { value: config.grain.blotch },
    uGrainGround: { value: config.grain.ground },
  };
  const program = new Program(gl, {
    vertex,
    fragment,
    cullFace: false,
    uniforms,
  });
  const ground = new Mesh(gl, {
    geometry: new Triangle(gl),
    program: new Program(gl, {
      vertex: groundVertex,
      fragment: groundFragment,
      uniforms,
      depthTest: false,
      depthWrite: false,
    }),
    frustumCulled: false,
    renderOrder: -1,
  });
  ground.setParent(roll);

  // one instance per piece; a Panel's pieces share its x, color and motion
  const owner = panels.flatMap((p, i) => p.pieces.map(() => i));
  const pieces = panels.flatMap((p) => p.pieces);
  const rise = new Float32Array(pieces.length).fill(1);
  const bend = new Float32Array(pieces.length * 2);
  const geometry = new Plane(gl, {
    widthSegments: 24,
    attributes: {
      aPanel: {
        instanced: 1,
        size: 3,
        data: new Float32Array(
          pieces.flatMap((p, j) => [panels[owner[j]].x, p.y0, p.y1]),
        ),
      },
      aColor: {
        instanced: 1,
        size: 3,
        data: new Float32Array(
          owner.flatMap((i) => [...new Color(panels[i].color)]),
        ),
      },
      aRise: { instanced: 1, size: 1, data: rise },
      aBend: { instanced: 1, size: 2, data: bend },
    },
  });
  new Mesh(gl, { geometry, program }).setParent(center);

  const depth = config.panels.depth;
  const bounds = {
    min: new Vec3(Math.min(...panels.map((p) => p.x)), 0, 0),
    max: new Vec3(
      Math.max(...panels.map((p) => p.x)),
      Math.max(...pieces.map((p) => p.y1)),
      depth,
    ),
  };
  center.position.set(
    -(bounds.min.x + bounds.max.x) / 2,
    -bounds.max.y / 2,
    -depth / 2,
  );

  const fit = () => {
    const { yaw: y, pitch: p, roll: r, padding } = config.view;
    yaw.rotation.y = rad(y);
    pitch.rotation.x = rad(p);
    roll.rotation.z = rad(r);
    roll.updateMatrixWorld();

    const { min, max } = bounds;
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map((i) =>
      new Vec3(
        i & 1 ? max.x : min.x,
        i & 2 ? max.y : min.y,
        i & 4 ? max.z : min.z,
      ).applyMatrix4(center.worldMatrix),
    );
    const xs = corners.map((c) => c.x);
    const ys = corners.map((c) => c.y);
    const w = Math.max(...xs) - Math.min(...xs);
    const h = Math.max(...ys) - Math.min(...ys);
    const aspect = gl.canvas.width / gl.canvas.height;
    const scale = 1 / (1 - padding * 2);
    const halfH = Math.max(h, w / aspect) * 0.5 * scale;
    camera.orthographic({
      left: -halfH * aspect,
      right: halfH * aspect,
      top: halfH,
      bottom: -halfH,
    });
  };

  const resize = () => {
    // re-read so moving to another screen or zooming stays sharp
    renderer.dpr = Math.min(devicePixelRatio, 3);
    renderer.setSize(innerWidth, innerHeight);
    uniforms.uEdgeWidth.value = config.color.edgeWidth * renderer.dpr;
    uniforms.uGrainSize.value = config.grain.size * renderer.dpr;
    fit();
  };

  const render = () => renderer.render({ scene: roll, camera });

  /** Intro progress per Panel: 0 = hidden below, 1 = at rest. */
  const setRise = (values: ArrayLike<number>) => {
    owner.forEach((i, j) => (rise[j] = values[i]));
    geometry.attributes.aRise.needsUpdate = true;
  };

  /** Sway size (radians) and phase (radians) for this frame. */
  const setSway = (amplitude: number, phase: number) => {
    uniforms.uSwayAmp.value = amplitude;
    uniforms.uSwayPhase.value = phase;
  };
  /** Grain re-roll step; a new value re-rolls every speckle. */
  const setGrain = (seed: number) => {
    uniforms.uGrainSeed.value = seed;
  };
  /** Rustle per Panel: tilt (radians) and where the bend sits (0 = Spine, 1 = free edge). */
  const setRustle = (angle: ArrayLike<number>, at: ArrayLike<number>) => {
    owner.forEach((i, j) => {
      bend[j * 2] = angle[i];
      bend[j * 2 + 1] = at[i];
    });
    geometry.attributes.aBend.needsUpdate = true;
  };

  /** The word's x (along), y (up) and z (depth) axes as they appear on screen: [right, down, toward viewer]. */
  const axes = () =>
    [new Vec3(1, 0, 0), new Vec3(0, 1, 0), new Vec3(0, 0, 1)].map((v) => {
      v.transformDirection(center.worldMatrix);
      return [v.x, -v.y, v.z] as const;
    });

  const inverse = new Mat4();
  /** The pointer ray in word space (cap heights), anchored on the mid-depth plane. */
  const toWord = (clientX: number, clientY: number) => {
    const { left, right, top, bottom } = camera;
    const wx = left + (clientX / innerWidth) * (right - left);
    const wy = top - (clientY / innerHeight) * (top - bottom);
    inverse.inverse(center.worldMatrix);
    const near = new Vec3(wx, wy, 0).applyMatrix4(inverse);
    const far = new Vec3(wx, wy, -1).applyMatrix4(inverse);
    const dz = far.z - near.z;
    if (Math.abs(dz) < 1e-6) return null;
    const t = (bounds.max.z / 2 - near.z) / dz;
    const dx = far.x - near.x;
    // a ray parallel to the sheets can't say where it meets them; treat it as a point
    const flat = Math.abs(dx) < 1e-6;
    return {
      x: near.x + dx * t,
      y: near.y + (far.y - near.y) * t,
      z: bounds.max.z / 2,
      slopeY: flat ? 0 : (far.y - near.y) / dx,
      slopeZ: flat ? 0 : dz / dx,
    };
  };

  resize();

  return {
    resize,
    render,
    setRise,
    setRustle,
    setSway,
    setGrain,
    toWord,
    axes,
  };
};
