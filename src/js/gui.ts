import GUI from "lil-gui";
import type { Config } from "./config.ts";

/** Dev-only color tuning. `rebuild` recolors Panels; `update` refreshes shading and edges. */
export const createGui = (
  // lil-gui edits colors in place
  // eslint-disable-next-line functional/prefer-immutable-types
  color: Config["color"],
  rebuild: () => void,
  update: () => void,
) => {
  // starts collapsed so it never covers the Sound toggle
  const gui = new GUI({ title: "KAZI Color", closeFolders: true }).close();

  gui.add(color, "seed", 0, 1000, 1).onChange(rebuild);
  gui.add(color, "runMin", 1, 10, 1).onChange(rebuild);
  gui.add(color, "runMax", 1, 10, 1).onChange(rebuild);
  gui.add(color, "accentChance", 0, 1, 0.01).onChange(rebuild);
  gui.add(color, "backShade", 0, 1, 0.01).onChange(update);
  gui.addColor(color, "edge").onChange(update);
  gui.addColor(color, "background").onChange(update);
  gui.addColor(color, "accent").onChange(rebuild);
  const palette = gui.addFolder("Palette").close();
  color.palette.forEach((_, i) =>
    palette.addColor(color.palette, i).onChange(rebuild),
  );

  const exportButton = gui.add(
    {
      export: () =>
        void exportJson(color).then((copied) => {
          if (!copied) return;
          exportButton.name("copied ✓");
          setTimeout(() => exportButton.name("export"), 1500);
        }),
    },
    "export",
  );
};

const exportJson = async (color: Readonly<Config["color"]>) => {
  const json = JSON.stringify(color, null, 2);
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
