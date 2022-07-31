import { scroll } from "motion";

function scrollyFun() {
  let currentY = 0;
  let targetY = 0;

  (function lerpedAnimation() {
    scroll(({ y }) => {
      targetY = mapRange(0, 1, clamp(0, y.progress, 1), 0, 360);
    });
    const deltaY = targetY - currentY;
    currentY += deltaY * 0.05;
    document.documentElement.style.setProperty("--deg", `${currentY}deg`);

    requestAnimationFrame(lerpedAnimation);
  })();
}

function mapRange(in_min, in_max, input, out_min, out_max) {
  return ((input - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min;
}

function clamp(min, input, max) {
  return Math.max(min, Math.min(input, max));
}

export { scrollyFun };
