// /**
//  * remove leftover workbox sw stuff
//  */

// (async function killServiceWorkers() {
//   try {
//     const registrations = await navigator.serviceWorker.getRegistrations();
//     const unregisterPromises = registrations.map((registration) =>
//       registration.unregister(),
//     );

//     const allCaches = await caches.keys();
//     const cacheDeletionPromises = allCaches.map((cache) =>
//       caches.delete(cache),
//     );

//     const clearAttempted = await Promise.allSettled([
//       ...unregisterPromises,
//       ...cacheDeletionPromises,
//     ]);

//     if (clearAttempted.length > 0) {
//       if (clearAttempted.includes((p) => p.status === "rejected")) {
//         throw new Error(
//           "There was an error clearing google workbox information",
//         );
//       } else {
//         window.location.reload();
//       }
//     }
//   } catch (err) {
//     console.error(err);
//   }
// })();

// (async function clearDbs() {
//   try {
//     const dbs = await indexedDB.databases();

//     if (dbs.length > 0) {
//       dbs.forEach((db) => {
//         const deletedDb = indexedDB.deleteDatabase(db.name);
//         deletedDb.onerror = () => {
//           throw new Error("Couldn’t delete google workbox indexDB");
//         };
//       });
//     }
//   } catch (err) {
//     console.error(err);
//   }
// })();

// self destructing sw
// https://github.com/NekR/self-destroying-sw

// self.addEventListener('install', function () {
//   self.skipWaiting()
// })

// self.addEventListener('activate', function () {
//   self.registration
//     .unregister()
//     .then(function () {
//       return self.clients.matchAll()
//     })
//     .then(function (clients) {
//       clients.forEach((client) => client.navigate(client.url))
//     })
// })
