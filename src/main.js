// animate bang
const bang = document.querySelector('.bang')

if (bang) {
  bang.addEventListener('animationend', () => (bang.style.animationName = ''), {
    passive: true,
  })

  const interactions = [
    'scroll',
    'resize',
    'mousedown',
    'mousemove',
    'touchstart',
    'keydown'
  ]

  interactions.forEach((interaction) =>
    window.addEventListener(interaction, throttle(animateBang, 650), {
      passive: true,
    })
  )

  const animations = ['groove', 'pop', 'swing', 'spin']
  let lastPlayed = ''

  function animateBang() {
    if (
      window.matchMedia('(orientation: landscape)').matches &&
      bang.style.animationName === ''
    ) {
      if (lastPlayed === '') {
        bang.style.animationName =
          animations[Math.floor(Math.random() * animations.length)]
        lastPlayed = bang.style.animationName
      } else {
        const filtered = animations.filter(
          (animation) => animation !== lastPlayed
        )
        bang.style.animationName =
          filtered[Math.floor(Math.random() * filtered.length)]
        lastPlayed = bang.style.animationName
      }
    }
  }
}

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

// throttle function
// https://github.com/gramkin/nano-throttle#readme
function throttle(callback, ms, trailing) {
  let t = 0
  let call
  arguments.length < 3 && (trailing = true)
  return function () {
    const args = arguments
    call = () => {
      callback.apply(this, args)
      t = new Date().getTime() + ms
      call = null
      trailing &&
        setTimeout(function () {
          call && call()
        }, ms)
    }
    if (new Date().getTime() > t) call()
  }
}

// polite console
console.log(
  '%cThanks for checking out my site!',
  'font-family: Helvetica, sans-serif; text-transform: uppercase; font-weight: bold; letter-spacing: .12em; font-size: 3rem; color: black;'
)
