import { defineConfig } from "vite";
import { generateSW } from "rollup-plugin-workbox";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    assetsInlineLimit: 256,
  },
  plugins: [
    generateSW({
      swDest: "./dist/sw.js",
      globDirectory: "./dist",
      globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,ico,woff2}"],
      sourcemap: false,
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
});
