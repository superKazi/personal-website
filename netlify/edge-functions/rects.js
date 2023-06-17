// TODO: Add better comments

import random from "https://esm.sh/canvas-sketch-util/random";
import palettes from "https://esm.sh/nice-color-palettes";

export default async (_, context) => {
  const response = await context.next();
  const page = await response.text();
  const regex = /{{rects}}/i;

  random.setSeed(context.geo.city || "Kazi");

  const palette = random.pick(palettes);
  const points = createGrid().filter(() =>
    Math.abs(random.gaussian(10, 1) > 0)
  );
  let rectStrings = "";

  points.forEach(({ color, dimensions, position: [u, v] }) => {
    rectStrings += `<rect x="${u * 100}" y="${
      v * 100
    }" width="${dimensions}px" height="${dimensions}px" fill="${color}" />`;
  });

  const updatedPage = page.replace(regex, rectStrings);

  response.headers.set("cache-control", "max-age=604800, public");

  function createGrid() {
    const points = [];
    const count = 100;
    for (let x = 0; x < count; x++) {
      for (let y = 0; y < count; y++) {
        const u = x / count;
        const v = y / count;
        points.push({
          color: random.pick(palette),
          dimensions: Math.abs(random.noise2D(u, v, 1.6, 1)),
          position: [u, v],
        });
      }
    }
    return points;
  }

  return new Response(updatedPage, response);
};
