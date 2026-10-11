import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  root: "./src",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    sourcemap: true,
  },
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{html,js,css,woff2}"],
        cleanupOutdatedCaches: true,
        navigateFallback: null,
        // A separate URL keeps the offline seed from intercepting live navigations.
        manifestTransforms: [async (entries) => ({
          manifest: entries.map((entry) =>
            entry.url === "index.html"
              ? { ...entry, url: "index.html?offline" }
              : entry,
          ),
          warnings: [],
        })],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "document-cache",
              fetchOptions: { cache: "no-store" },
              cacheableResponse: { statuses: [200] },
              expiration: { maxEntries: 1 },
              precacheFallback: { fallbackURL: "index.html?offline" },
            },
          },
        ],
      },
    }),
  ],
});
