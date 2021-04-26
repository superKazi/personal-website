const animate = async (loadCssFn) => {
  try {
    // https://animejs.com/documentation/
    const animeLib = await import(
      'https://cdn.skypack.dev/pin/animejs@v3.2.1-bxGmKN3J3Mb49M8BrbV5/mode=imports,min/optimized/animejs.js'
    )

    const styles = await loadCssFn('./shapes.css?v=2.1.0')

    if (animeLib.default && styles.rel === 'stylesheet') {

      const anime = animeLib.default

      document.body.innerHTML += `
      <div aria-hidden="true" style="opacity: 0;" class="shape" id="circle"></div>
      <div aria-hidden="true" style="opacity: 0;" class="shape" id="square"></div>
      <div aria-hidden="true" style="opacity: 0;" class="shape" id="triangle"></div>
    `

      const springs = [
        'spring(5, 90, 15, 1)',
        'spring(1, 80, 10, 0)',
        'spring(2.5, 70, 20, .5)',
      ]

      const circle = () => {
        anime({
          targets: '#circle',
          translateX: anime.random(
            0,
            document.body.clientWidth -
              document.querySelector('.shape').clientWidth
          ),
          translateY: anime.random(
            0,
            document.body.clientHeight -
              document.querySelector('.shape').clientHeight
          ),
          easing: springs[(Math.random() * springs.length) | 0],
          complete: () => {
            if (document.querySelector('#circle').style.opacity === '0') {
              document
                .querySelector('#circle')
                .style.setProperty('opacity', '1')
            }
            circle()
          },
        })
      }

      const square = () => {
        anime({
          targets: '#square',
          translateX: anime.random(
            0,
            document.body.clientWidth -
              document.querySelector('.shape').clientWidth
          ),
          translateY: anime.random(
            0,
            document.body.clientHeight -
              document.querySelector('.shape').clientHeight
          ),
          rotate: anime.random(0, 360),
          easing: springs[(Math.random() * springs.length) | 0],
          complete: () => {
            if (document.querySelector('#square').style.opacity === '0') {
              document
                .querySelector('#square')
                .style.setProperty('opacity', '1')
            }
            square()
          },
        })
      }

      const triangle = () => {
        anime({
          targets: '#triangle',
          translateX: anime.random(
            0,
            document.body.clientWidth -
              document.querySelector('.shape').clientWidth
          ),
          translateY: anime.random(
            0,
            document.body.clientHeight -
              document.querySelector('.shape').clientHeight
          ),
          rotate: anime.random(0, 360),
          easing: springs[(Math.random() * springs.length) | 0],
          complete: () => {
            if (document.querySelector('#triangle').style.opacity === '0') {
              document
                .querySelector('#triangle')
                .style.setProperty('opacity', '1')
            }
            triangle()
          },
        })
      }

      circle()
      square()
      triangle()
    }
  } catch (error) {
    console.error(error)
  }
}

export { animate }
