import Mdict from "../src/index";

// const mdict = new Mdict2("mdx/ETDict.mdx");
const mdict = new Mdict("mdx/oale8.mdx");
console.log(mdict.lookup("hello"));

console.log(mdict.lookup("world"));

console.log(mdict.lookup("yes"));

// console.log(mdict.prefix("hello"));
// console.log(mdict.lookup("//uk/hello__gb_1.mp3"));
// console.log(mdict.similar("hello"));

// console.log(mdict.key_data[mdict.trie.lookup("2p")]);
// const d1 = new Date().getTime();
// for (let i = 0; i < 10; i++) {
//   console.log(mdict.lookup("hello"));
//   console.log(mdict.lookup("world"));
// }

// const d2 = new Date().getTime();
// console.log("time", d2 - d1);

