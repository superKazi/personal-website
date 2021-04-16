// self destructing sw
// https://github.com/NekR/self-destroying-sw

// self.addEventListener('install', function (e) {
//   self.skipWaiting()
// })

// self.addEventListener('activate', function (e) {
//   self.registration
//     .unregister()
//     .then(function () {
//       return self.clients.matchAll()
//     })
//     .then(function (clients) {
//       clients.forEach((client) => client.navigate(client.url))
//     })
// })

// remove leftover workbox sw stuff

// if (typeof indexedDB.databases === 'function') {
//   indexedDB
//     .databases()
//     .then((dbs) => {
//       if (dbs.length > 0) {
//         dbs.forEach((db) => indexedDB.deleteDatabase(db.name))
//       }
//     })
//     .then(() => null)
//     .catch((e) => console.error(e))
// }