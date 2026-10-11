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
      },
    }),
  ],
});
