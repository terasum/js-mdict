import BKTree from "../src/bktree";

// --------------------
// BKTree tests
// --------------------
const words = ["浙大", "浙江大学", "浙江大学软件学院", "浙大软院", "felt", "oops", "pop", "oouch", "halt"];

const bktree = new BKTree(words.length);
bktree.add(words);
console.log(bktree.simWords("浙大", 3));
