import { defineConfig } from "vite";
import { generateSW } from "rollup-plugin-workbox";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [
    generateSW({
      dontCacheBustURLsMatching: new RegExp(".*assets/.*"),
      swDest: "./dist/sw.js",
      globDirectory: "./dist",
      globPatterns: ["**/*.{js,css}"],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
});
