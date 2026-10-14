import {
  Camera,
  Color,
  Mat4,
  Mesh,
  Plane,
  Program,
  Renderer,
  Transform,
  Vec3,
} from "ogl";
import type { Config } from "./config.ts";
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

const fragment = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
in vec3 vColor;
in float vRise;
uniform float uFade;
uniform float uBackShade;
uniform float uEdgeWidth;
uniform vec3 uEdge;
out vec4 fragColor;
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
  fragColor = vec4(mix(color, uEdge, edge), 1.0);
}`;

const rad = (deg: number) => (deg * Math.PI) / 180;

export const createScene = (canvas: HTMLCanvasElement) => {
  const renderer = new Renderer({
    canvas,
    dpr: Math.min(devicePixelRatio, 2),
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
    uDepth: { value: 1 },
    uRiseDistance: { value: 1 },
    uBendSharpness: { value: 0 },
    uBendWidth: { value: 0.3 },
    uSwayAmp: { value: 0 },
    uSwayPhase: { value: 0 },
    uSwayWave: { value: 1 },
    uFade: { value: 0 },
    uBackShade: { value: 1 },
    uEdgeWidth: { value: 1 },
    uEdge: { value: new Color() },
  };
  const program = new Program(gl, {
    vertex,
    fragment,
    cullFace: false,
    uniforms,
  });

  // eslint-disable-next-line functional/no-let
  let mesh: Mesh | undefined;
  // eslint-disable-next-line functional/no-let
  let rise = new Float32Array();
  // eslint-disable-next-line functional/no-let
  let bend = new Float32Array();
  // eslint-disable-next-line functional/no-let
  let bounds = { min: new Vec3(), max: new Vec3() };

  const fit = (cfg: Readonly<Config>) => {
    const { yaw: y, pitch: p, roll: r, padding } = cfg.view;
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

  const build = (panels: readonly Panel[], cfg: Readonly<Config>) => {
    mesh?.setParent(null);
    mesh?.geometry.remove();
    const panel = new Float32Array(
      panels.flatMap((p) => [p.x, p.y0, p.y1]),
    );
    const color = new Float32Array(
      panels.flatMap((p) => [...new Color(p.color)]),
    );
    rise = new Float32Array(panels.length).fill(1);
    bend = new Float32Array(panels.length * 2);
    const geometry = new Plane(gl, {
      heightSegments: 24,
      attributes: {
        aPanel: { instanced: 1, size: 3, data: panel },
        aColor: { instanced: 1, size: 3, data: color },
        aRise: { instanced: 1, size: 1, data: rise },
        aBend: { instanced: 1, size: 2, data: bend },
      },
    });
    mesh = new Mesh(gl, { geometry, program });
    mesh.setParent(center);

    const depth = cfg.panels.depth;
    bounds = {
      min: new Vec3(Math.min(...panels.map((p) => p.x)), 0, 0),
      max: new Vec3(
        Math.max(...panels.map((p) => p.x)),
        Math.max(...panels.map((p) => p.y1)),
        depth,
      ),
    };
    center.position.set(
      -(bounds.min.x + bounds.max.x) / 2,
      -bounds.max.y / 2,
      -depth / 2,
    );
    update(cfg);
  };

  /** Apply everything that doesn't need new Panels. */
  const update = (cfg: Readonly<Config>) => {
    uniforms.uDepth.value = cfg.panels.depth;
    uniforms.uRiseDistance.value = cfg.intro.distance;
    uniforms.uFade.value = cfg.intro.fade;
    uniforms.uBendSharpness.value = cfg.rustle.bendSharpness;
    uniforms.uBendWidth.value = cfg.rustle.bendWidth;
    uniforms.uSwayWave.value = cfg.sway.wave;
    uniforms.uBackShade.value = cfg.color.backShade;
    uniforms.uEdgeWidth.value = cfg.color.edgeWidth * renderer.dpr;
    uniforms.uEdge.value.set(cfg.color.edge);
    const bg = new Color(cfg.color.background);
    gl.clearColor(bg.r, bg.g, bg.b, 1);
    fit(cfg);
  };

  const resize = (cfg: Readonly<Config>) => {
    // re-read so moving to another screen or zooming stays sharp
    renderer.dpr = Math.min(devicePixelRatio, 2);
    renderer.setSize(innerWidth, innerHeight);
    update(cfg);
  };

  const render = () => renderer.render({ scene: roll, camera });

  /** Per-Panel intro progress; write into it, then call `commitRise`. */
  const getRise = () => rise;
  const commitRise = () => {
    if (mesh) mesh.geometry.attributes.aRise.needsUpdate = true;
  };

  /** Sway size (radians) and phase (radians) for this frame. */
  const setSway = (amplitude: number, phase: number) => {
    uniforms.uSwayAmp.value = amplitude;
    uniforms.uSwayPhase.value = phase;
  };
  /** Per-Panel Rustle as [tilt, bend position]; write into it, then call `commitBend`. */
  const getBend = () => bend;
  const commitBend = () => {
    if (mesh) mesh.geometry.attributes.aBend.needsUpdate = true;
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

  return {
    build,
    update,
    resize,
    render,
    getRise,
    commitRise,
    getBend,
    commitBend,
    setSway,
    toWord,
    axes,
  };
};
