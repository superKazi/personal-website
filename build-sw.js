// https://developers.google.com/web/tools/workbox/guides/generate-service-worker/workbox-build
// https://developers.google.com/web/tools/workbox/modules/workbox-build
const { generateSW } = require('workbox-build')

const swDest = './src/sw.js'

// https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-build#.generateSW
generateSW({
  swDest,
  globDirectory: './src',
  globPatterns: ['**/index.html'],
  globIgnores: ['**/*.{json,js,png,jpg,svg,ico,woff2}'],
  clientsClaim: true,
  skipWaiting: true,
  sourcemap: false,
  inlineWorkboxRuntime: true,
  cleanupOutdatedCaches: true,
  dontCacheBustURLsMatching: /.*/,
  babelPresetEnvTargets: ['supports es6-module'],

  // https://web.dev/runtime-caching-with-workbox/
  runtimeCaching: [
    {
      urlPattern: /.*(\?v=.*)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'versioned-assets',
        expiration: {
          maxAgeSeconds: 604800,
          maxEntries: 10,
        },
      },
    },
    {
      urlPattern: /\.(?:html|json|js)$/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'unversioned-assets',
        networkTimeoutSeconds: 2,
        expiration: {
          maxAgeSeconds: 604800,
          maxEntries: 10,
        },
      },
    },
  ],
}).then(({ count, size }) => {
  console.log(
    `Generated ${swDest}, which will precache ${count} files, totaling ${size} bytes.`
  )
})
