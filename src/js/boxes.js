import { spring, animate, stagger } from "motion";
import { shuffle, sample } from "es-toolkit";
import colors from "dictionary-of-colour-combinations";

function colorThings() {
  let num = 121;
  let threeColorCombos = [];

  while (num <= 240) {
    threeColorCombos.push(colors.filter((el) => el.combinations.includes(num)));
    num = num + 1;
  }

  const finalColors = shuffle(sample(threeColorCombos));
  console.log(
    "%cHere's the Sanzo Wada color swatch:",
    `font-family: Inter, Roboto, "Helvetica Neue", "Arial Nova",
		"Nimbus Sans", Arial, sans-serif; text-transform: uppercase; font-weight:     bold; letter-spacing: .12em; font-size: 3rem; color: black;`,
  );
  console.table(finalColors);
  let colorMarkup = "";
  finalColors.forEach((color, index) => {
    colorMarkup += `
      <b 
        aria-hidden="true"
        style="
          display: block; 
          inline-size: 100%; 
          block-size: 100%; 
          transform-origin: left; 
          background: ${color.hex};"
      >
      </b>
    `;
    document
      .querySelectorAll("a")
      [index].style.setProperty(`--color`, color.hex);
    document
      .querySelector("[data-word='\\2728']")
      .style.setProperty(`--color-${index}`, color.hex);
  });
  document.querySelector("main").insertAdjacentHTML("beforeend", colorMarkup);

  animate(
    "b",
    {
      scaleX: [0, 1],
    },
    {
      type: spring,
      bounce: 0,
      delay: stagger(0.12),
    },
  );
}

export { colorThings };
