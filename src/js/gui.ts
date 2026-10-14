import GUI from "lil-gui";
import type { Config } from "./config.ts";
import { EASES } from "./intro.ts";

/** Dev-only tuning panel. `rebuild` re-slices Panels, `update` only re-renders, `replay` restarts the intro. */
export const createGui = (
  // lil-gui edits config in place
  // eslint-disable-next-line functional/prefer-immutable-types
  config: Config,
  rebuild: () => void,
  update: () => void,
  replay: () => void,
) => {
  // starts collapsed so it never covers the Sound toggle
  const gui = new GUI({ title: "KAZI", closeFolders: true }).close();

  const view = gui.addFolder("View");
  view.add(config.view, "yaw", -90, 90, 1);
  view.add(config.view, "pitch", -90, 90, 1);
  view.add(config.view, "roll", -90, 90, 1);
  view.add(config.view, "padding", 0, 0.4, 0.01);
  view.onChange(update);

  const panels = gui.addFolder("Panels");
  panels.add(config.panels, "density", 2, 40, 1).onFinishChange(rebuild);
  panels.add(config.panels, "tracking", 0, 0.6, 0.01).onFinishChange(rebuild);
  panels.add(config.panels, "depth", 0.05, 3, 0.01).onChange(rebuild);

  const intro = gui.addFolder("Intro");
  intro.add(config.intro, "duration", 0.1, 3, 0.05);
  intro.add(config.intro, "stagger", 0, 3, 0.05);
  intro.add(config.intro, "ease", EASES);
  intro.add(config.intro, "distance", 0, 4, 0.05).onChange(update);
  intro.add(config.intro, "fade", 0, 1, 0.01).onChange(update);
  intro.add({ replay }, "replay").name("replay intro");

  const rustle = gui.addFolder("Rustle");
  rustle.add(config.rustle, "stiffness", 1, 300, 1);
  rustle.add(config.rustle, "damping", 0, 40, 0.1);
  rustle.add(config.rustle, "coupling", 0, 200, 1);
  rustle.add(config.rustle, "strength", 0, 10, 0.05);
  rustle.add(config.rustle, "radius", 0.01, 2, 0.01);
  rustle.add(config.rustle, "margin", 0, 1, 0.01);
  rustle.add(config.rustle, "maxAngle", 0.1, 1.5, 0.01);
  rustle.add(config.rustle, "bendSharpness", 0, 1, 0.01).onChange(update);
  rustle.add(config.rustle, "bendWidth", 0.02, 1, 0.01).onChange(update);

  const sway = gui.addFolder("Sway");
  sway.add(config.sway, "amplitude", 0, 0.2, 0.001);
  sway.add(config.sway, "speed", 0, 1, 0.01);
  sway.add(config.sway, "wave", 0, 6, 0.05).onChange(update);
  sway.add(config.sway, "reducedAmplitude", 0, 0.2, 0.001);
  sway.add(config.sway, "reducedSpeed", 0, 1, 0.01);

  const color = gui.addFolder("Color");
  color.add(config.color, "seed", 0, 1000, 1).onChange(rebuild);
  color.add(config.color, "runMin", 1, 10, 1).onChange(rebuild);
  color.add(config.color, "runMax", 1, 10, 1).onChange(rebuild);
  color.add(config.color, "accentChance", 0, 1, 0.01).onChange(rebuild);
  color.add(config.color, "backShade", 0, 1, 0.01).onChange(update);
  color.add(config.color, "edgeWidth", 0, 4, 0.25).onChange(update);
  color.addColor(config.color, "edge").onChange(update);
  color.addColor(config.color, "background").onChange(update);
  color.addColor(config.color, "accent").onChange(rebuild);
  const palette = color.addFolder("Palette").close();
  config.color.palette.forEach((_, i) =>
    palette.addColor(config.color.palette, i).onChange(rebuild),
  );

  const exportButton = gui.add(
    {
      export: () =>
        void exportJson(config).then((copied) => {
          if (!copied) return;
          exportButton.name("copied ✓");
          setTimeout(() => exportButton.name("export"), 1500);
        }),
    },
    "export",
  );
};

const exportJson = async (config: Readonly<Config>) => {
  const json = JSON.stringify(config, null, 2);
  try {
    await navigator.clipboard.writeText(json);
    return true;
  } catch {
    // clipboard needs a secure context, which the phone-over-LAN dev URL isn't
    const box = document.createElement("textarea");
    box.value = json;
    box.readOnly = true;
    box.style.cssText =
      "position:fixed;inset:1rem;z-index:10;font:12px monospace;background:#fff;color:#000";
    box.addEventListener("blur", () => box.remove());
    document.body.append(box);
    box.focus();
    box.select();
    return false;
  }
};
