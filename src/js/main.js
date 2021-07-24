// service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      // https://developers.google.com/web/tools/workbox/modules/workbox-window
      const { Workbox } = await import('./workbox-window-prod.mjs')
      if (Workbox) {
        const wb = new Workbox('../sw.js')
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

// mobile vh unit fix
;(function perfectVh() {
  let vh = window.innerHeight * 0.01
  document.documentElement.style.setProperty('--vh', `${vh}px`)

  window.addEventListener('resize', () => {
    vh = window.innerHeight * 0.01
    document.documentElement.style.setProperty('--vh', `${vh}px`)
  })
})()

// animate middle name
;(async function bouncyText() {
  const animationsOn = !window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches

  if (animationsOn) {
    try {
      const animeLib = await import('./anime.js?v=3.0.2')
      const splittingLib = await import('./splitting.js?v=3.0.2')
      const splittingStyles = await loadCss('../styles/splitting.css?v=3.0.2')

      if (animeLib.default && splittingLib.default && splittingStyles) {
        const anime = animeLib.default
        const Splitting = splittingLib.default
        const article = document.querySelector('article')

        Splitting()

        const animation = anime({
          targets: '.char',
          translateY: [
            { value: 0 },
            { value: -20 },
            { value: 0 },
            { value: 20 },
            { value: 0 },
          ],
          skew: [
            { value: 0 },
            { value: -20 },
            { value: 0 },
            { value: 20 },
            { value: 0 },
          ],
          opacity: [
            { value: 1 },
            { value: 0.333 },
            { value: 0.666 },
            { value: 0.333 },
            { value: 1 },
          ],
          delay: (el, i) => i * 100,
          easing: 'easeInOutSine',
          autoplay: false,
        })

        article.addEventListener(
          'scroll',
          ({ currentTarget }) => {
            const scrollTop = currentTarget.scrollTop
            const scrollHeight = currentTarget.scrollHeight
            const articleHeight = currentTarget.offsetHeight
            const scrollPercent = scrollTop / (scrollHeight - articleHeight)

            animation.seek(animation.duration * scrollPercent)
          },
          { passive: true }
        )
      }
    } catch (error) {
      console.error(error)
    }
  }
})()

// delete old stuff
if (localStorage.getItem('visited') === 'kaziTown') {
  localStorage.removeItem('visited')
}

// css loader helper
function loadCss(src) {
  return new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.href = src
    link.rel = 'stylesheet'
    link.type = 'text/css'
    link.crossOrigin = 'anonymous'

    link.addEventListener('load', () => resolve(true))
    link.addEventListener('error', () =>
      reject(new Error(`Style load error for ${src}`))
    )

    document.head.appendChild(link)
  })
}

// polite console
console.log(
  '%cThanks for checking out my site!',
  'font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;'
)
