import Mdict from "../src";

// const mdict = new Mdict2("mdx/ETDict.mdx");
const mdict = new Mdict("mdx/oale8.mdx");

const t1 = new Date().getMilliseconds();
for (let i = 0; i < 100; i++) {
  mdict.lookup("incited");
}
const t2 = new Date().getMilliseconds();
console.log(`${(t2 - t1) / 100}ms/op`);


const t3 = new Date().getMilliseconds();
for (let i = 0; i < 100; i++) {
  mdict.bsearch("incited");
}
const t4 = new Date().getMilliseconds();
console.log(`${(t4 - t3) / 100}ms/op`);


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
