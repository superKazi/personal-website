// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    // https://developers.google.com/web/tools/workbox/modules/workbox-window
    const { Workbox } = await import(
      'https://storage.googleapis.com/workbox-cdn/releases/6.0.0/workbox-window.prod.mjs'
    )
    const wb = new Workbox('./sw.js')
    wb.addEventListener('installed', (event) => {
      if (event.isUpdate) {
        window.location.reload()
      }
    })
    wb.register()
  })
}

// animate bang
;(async function bang() {
  if (window.matchMedia('(orientation: landscape)').matches) {
    const { animate } = await import('./bang.js?v=2.0.0')
    animate()
  }
})()

// polite console
console.log(
  '%cThanks for checking out my site!',
  'font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;'
)
