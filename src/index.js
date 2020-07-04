import "./styles/style.scss";
import { debounce } from "mini-debounce";
import { Workbox } from "workbox-window";
import { Notyf } from "notyf";
import * as createFocusTrap from "focus-trap";
import { Polyline, Renderer, Transform, Vec3, Color } from "ogl";

//animation shamelessly stolen from https://tympanus.net/codrops/2019/09/24/crafting-stylised-mouse-trails-with-ogl/
const vertex = `
      attribute vec3 position;
      attribute vec3 next;
      attribute vec3 prev;
      attribute vec2 uv;
      attribute float side;

      uniform vec2 uResolution;
      uniform float uDPR;
      uniform float uThickness;

      vec4 getPosition() {
          vec2 aspect = vec2(uResolution.x / uResolution.y, 1);
          vec2 nextScreen = next.xy * aspect;
          vec2 prevScreen = prev.xy * aspect;

          vec2 tangent = normalize(nextScreen - prevScreen);
          vec2 normal = vec2(-tangent.y, tangent.x);
          normal /= aspect;
          normal *= 1.0 - pow(abs(uv.y - 0.5) * 1.9, 2.0);

          float pixelWidth = 1.0 / (uResolution.y / uDPR);
          normal *= pixelWidth * uThickness;

          // When the points are on top of each other, shrink the line to avoid artifacts.
          float dist = length(nextScreen - prevScreen);
          normal *= smoothstep(0.0, 0.02, dist);

          vec4 current = vec4(position, 1);
          current.xy -= normal * side;
          return current;
      }

      void main() {
          gl_Position = getPosition();
      }
  `;

const renderer = new Renderer({ dpr: 2 });
const gl = renderer.gl;
document.body.appendChild(gl.canvas);
gl.clearColor(0.0, 0.0, 0.0, 0.0);

const scene = new Transform();

const lines = [];

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight);

  lines.forEach((line) => line.polyline.resize());
}
window.addEventListener("resize", resize, false);

function random(a, b) {
  const alpha = Math.random();
  return a * (1.0 - alpha) + b * alpha;
}

["#c6ffdd", "#fbd786", "#f7797d"].forEach((color) => {
  const line = {
    spring: random(0.02, 0.1),
    friction: random(0.7, 0.95),
    mouseVelocity: new Vec3(),
    mouseOffset: new Vec3(random(-1, 1) * 0.02),
  };

  const count = 12;
  const points = (line.points = []);
  for (let i = 0; i < count; i++) points.push(new Vec3());

  line.polyline = new Polyline(gl, {
    points,
    vertex,
    uniforms: {
      uColor: { value: new Color(color) },
      uThickness: { value: random(20, 50) },
    },
  });

  line.polyline.mesh.setParent(scene);

  lines.push(line);
});

resize();

const mouse = new Vec3();
if ("ontouchstart" in window) {
  window.addEventListener("touchstart", updateMouse, false);
  window.addEventListener("touchmove", updateMouse, false);
} else {
  window.addEventListener("mousemove", updateMouse, false);
}

function updateMouse(e) {
  if (e.changedTouches && e.changedTouches.length) {
    e.x = e.changedTouches[0].pageX;
    e.y = e.changedTouches[0].pageY;
  }
  if (e.x === undefined) {
    e.x = e.pageX;
    e.y = e.pageY;
  }

  mouse.set(
    (e.x / gl.renderer.width) * 2 - 1,
    (e.y / gl.renderer.height) * -2 + 1,
    0
  );
}

const tmp = new Vec3();

requestAnimationFrame(update);
function update() {
  requestAnimationFrame(update);

  lines.forEach((line) => {
    for (let i = line.points.length - 1; i >= 0; i--) {
      if (!i) {
        tmp
          .copy(mouse)
          .add(line.mouseOffset)
          .sub(line.points[i])
          .multiply(line.spring);
        line.mouseVelocity.add(tmp).multiply(line.friction);
        line.points[i].add(line.mouseVelocity);
      } else {
        line.points[i].lerp(line.points[i - 1], 0.9);
      }
    }
    line.polyline.updateGeometry();
  });

  renderer.render({ scene });
}

// service worker code
if ("serviceWorker" in navigator) {
  const wb = new Workbox("/sw.js");
  const notyf = new Notyf();

  wb.addEventListener("installed", (event) => {
    if (event.isUpdate) {
      notyf.success({
        message:
          "Hiya! My website has changed at least a teeny bit since you last visited. Refresh to get the latest version.",
        duration: 8000,
        icon: false,
        background: "white",
        position: {
          x: "left",
          y: "bottom",
        },
        ripple: true,
        className: "kazi-notyf",
        dismissible: true,
      });
    }
  });
  wb.register();
}

// client code
let vh = window.innerHeight * 0.01;
document.documentElement.style.setProperty("--vh", `${vh}px`);

window.addEventListener(
  "resize",
  debounce(() => {
    vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty("--vh", `${vh}px`);
  }, 300)
);

const workButton = document.querySelector("#show-work");
const posterButton = document.querySelector("#show-poster");
const poster = document.querySelector("#poster");
const work = document.querySelector("#work");
const focusTrap = createFocusTrap(work, {
  escapeDeactivates: false,
});

let clickCount = false;

workButton.addEventListener("click", showWork);
posterButton.addEventListener("click", showPoster);

function showWork() {
  if (!clickCount) {
    poster.classList.add("exitposter");
    poster.classList.remove("enterposter");
    work.classList.add("enterwork");
    work.classList.remove("exitwork");
    clickCount = !clickCount;
    focusTrap.activate();
  }
}

function showPoster() {
  if (clickCount) {
    poster.classList.remove("exitposter");
    poster.classList.add("enterposter");
    work.classList.remove("enterwork");
    work.classList.add("exitwork");
    clickCount = !clickCount;
    focusTrap.deactivate();
  }
}

// polite console
console.log(
  "%c Thanks for checking out my site!",
  "font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem;color: black; text-shadow: 3px 3px 0 rgb(247,121,125) , 6px 6px 0 rgb(247,121,125) , 9px 9px 0 rgb(251,215,123) , 12px 12px 0 rgb(251,215,123) , 15px 15px 0 rgb(198,255,221) , 18px 18px 0 rgb(198,255,221) , 21px 21px 0 rgb(198,255,221)"
);
