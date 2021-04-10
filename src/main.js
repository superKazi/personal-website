// animate bang
;(async function bang() {
  if (window.matchMedia('(orientation: landscape)').matches) {
    const { animate } = await import('./bang.js?v=1.1.8')
    animate()
  }
})()

// remove leftover workbox sw stuff
if (typeof indexedDB.databases === 'function') {
  indexedDB
    .databases()
    .then((dbs) => {
      if (dbs.length > 0) {
        dbs.forEach((db) => indexedDB.deleteDatabase(db.name))
      }
    })
    .then(() => null)
    .catch((e) => console.error(e))
}

// polite console
console.log(
  '%cThanks for checking out my site!',
  'font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;'
)
