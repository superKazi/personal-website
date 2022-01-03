// retire sw
// async function handleServiceWorker() {
//   if ("serviceWorker" in navigator) {
//     try {
//       // https://developers.google.com/web/tools/workbox/modules/workbox-window
//       const { Workbox } = await import("workbox-window");
//       const wb = new Workbox("../sw.js");
//       wb.addEventListener("installed", (event) => {
//         if (event.isUpdate) {
//           window.location.reload();
//         }
//       });
//       wb.register();
//     } catch (err) {
//       console.error(err);
//     }
//   }
// }

// retire vite config with sw
// export default defineConfig({
//   root: "./src",
//   build: {
//     outDir: "../dist",
//     emptyOutDir: true,
//   },
//   plugins: [
//     generateSW({
//       swDest: "./dist/sw.js",
//       globDirectory: "./dist",
//       globPatterns: ["**/*.{js,css,html,png,jpg,jpeg,svg,ico,woff2}"],
//       sourcemap: false,
//       cleanupOutdatedCaches: true,
//       clientsClaim: true,
//       skipWaiting: true,
//     }),
//   ],
// });