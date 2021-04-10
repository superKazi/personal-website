// https://www.30secondsofcode.org/js/s/throttle
const throttle = (fn, wait) => {
  let inThrottle, lastFn, lastTime
  return function () {
    const context = this
    const args = arguments
    if (!inThrottle) {
      fn.apply(context, args)
      lastTime = Date.now()
      inThrottle = true
    } else {
      clearTimeout(lastFn)
      lastFn = setTimeout(function () {
        if (Date.now() - lastTime >= wait) {
          fn.apply(context, args)
          lastTime = Date.now()
        }
      }, Math.max(wait - (Date.now() - lastTime), 0))
    }
  }
}

// animate bang
const animate = () => {
  const bang = document.querySelector('.bang')

  if (bang) {
    const interactions = [
      'scroll',
      'resize',
      'mousedown',
      'mousemove',
      'touchstart',
      'keydown',
    ]
    const animations = ['groove', 'pop', 'spin', 'bounce']
    let lastPlayed = ''

    const animateBang = () => {
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

    bang.addEventListener('animationend', () => (bang.style.animationName = ''))

    interactions.forEach((interaction) =>
      window.addEventListener(interaction, throttle(animateBang, 650), {
        passive: true,
      })
    )
  }
}

export { animate }
