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
      runtimeCaching: [
        {
          urlPattern: ({ request }) => request.destination === "font",
          handler: "StaleWhileRevalidate",
          options: {
            cacheName: "fonts-cache",
            expiration: {
              maxEntries: 1,
            },
          },
        },
        {
          urlPattern: ({ request }) => request.destination === "document",
          handler: "NetworkFirst",
          options: {
            cacheName: "document-cache",
            expiration: {
              maxEntries: 1,
            },
          },
        },
      ],
      cleanupOutdatedCaches: true,
      clientsClaim: true,
      skipWaiting: true,
    }),
  ],
});
