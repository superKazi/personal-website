// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // https://developers.google.com/web/tools/workbox/modules/workbox-window
      const lib = await import(
        'https://storage.googleapis.com/workbox-cdn/releases/6.0.0/workbox-window.prod.mjs'
      )
      if (lib.Workbox) {
        const wb = new lib.Workbox('./sw.js')
        wb.addEventListener('installed', (event) => {
          if (event.isUpdate) {
            window.location.reload()
          }
        })
        wb.register()
      }
    } catch (error) {
      console.error(error)
    }
  })
}

// css loader helper
const loadCss = (src) => {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.href = src
    link.rel = 'stylesheet'
    link.type = 'text/css'

    link.addEventListener('load', () => resolve(link))
    link.addEventListener('error', () =>
      reject(new Error(`Style load error for ${src}`))
    )

    document.head.appendChild(link)
  })
}

// animations
if (localStorage.getItem('visited') === null) {
  localStorage.setItem('visited', 'kaziTown')
  ;(async function bang() {
    if (
      window.matchMedia('(orientation: landscape)').matches &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      try {
        const bangLib = await import('./bang.js?v=2.1.0')
        if (bangLib.animate) {
          bangLib.animate(loadCss)
        }
      } catch (error) {
        console.error(error)
      }
    }
  })()
} else if (localStorage.getItem('visited') === 'kaziTown') {
  ;(async function shapes() {
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      try {
        const shapesLib = await import('./shapes.js?v=2.1.1')
        if (shapesLib.animate) {
          shapesLib.animate(loadCss)
        }
      } catch (error) {
        console.error(error)
      }
    }
  })()
}

// polite console
console.log(
  '%cThanks for checking out my site!',
  'font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;'
)
