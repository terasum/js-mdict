import Mdict from "../src";

const mdict = new Mdict("mdx/oale8.mdx");

const t1 = new Date().getMilliseconds();
const def = mdict.lookup("micro");
console.log(def);
const t2 = new Date().getMilliseconds();
console.log(`${(t2 - t1)}ms/op`);

const t3 = new Date().getMilliseconds();
const sim_words = mdict.fuzzy_search("wrapper", 5);
console.log(sim_words.sort((w1, w2) => w1.ed - w2.ed));
const t4 = new Date().getMilliseconds();

console.log(`${(t4 - t3)}ms/op`);
