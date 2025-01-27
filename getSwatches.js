//node script to get the colors i want into a json
import colors from "dictionary-of-colour-combinations" with { type: "json" };
import { writeFile } from "fs";

let num = 121;
let threeColorCombos = [];

while (num <= 240) {
  threeColorCombos.push(colors.filter((el) => el.combinations.includes(num)));
  num = num + 1;
}

const str = JSON.stringify(threeColorCombos);

writeFile(`${process.cwd()}/src/js/colors.json`, str, (err) =>
  console.error(err),
);
