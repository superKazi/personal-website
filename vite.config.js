import { defineConfig } from "vite";
import { generateSW } from "rollup-plugin-workbox";
import copy from "rollup-plugin-copy";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  plugins: [
    copy({
      targets: [
        {
          src: ["./src/_headers", "./src/_redirects", "./src/robots.txt"],
          dest: "./dist/",
        },
      ],
      hook: "closeBundle",
    }),
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
