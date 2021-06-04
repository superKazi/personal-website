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
  try {
    const animeLib = await import(
      'https://cdn.skypack.dev/pin/animejs@v3.2.1-bxGmKN3J3Mb49M8BrbV5/mode=imports,min/optimized/animejs.js'
    )
    const splittingLib = await import(
      'https://cdn.skypack.dev/pin/splitting@v1.0.6-Za2vDy3XuQ4lO2x5hbUG/mode=imports,min/optimized/splitting.js'
    )
    const splittingStyles = await loadCss(
      'https://unpkg.com/splitting@1.0.6/dist/splitting.css'
    )

    if (animeLib.default && splittingLib.default && splittingStyles) {
      const anime = animeLib.default
      const Splitting = splittingLib.default
      const article = document.querySelector('article')

      Splitting()

      const animation = anime({
        targets: '.char',
        translateY: [
          { value: 0 },
          { value: -10 },
          { value: 0 },
          { value: 10 },
          { value: 0 },
        ],
        skew: [
          { value: 0 },
          { value: -10 },
          { value: 0 },
          { value: 10 },
          { value: 0 },
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
