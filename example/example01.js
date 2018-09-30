
import Mdict from "../src";

// loading dictionary
const mdict = new Mdict("mdx/oale8.mdx");
console.log(mdict.lookup("interactive"));
console.log(mdict.bsearch("interactive"));
console.log(mdict.fuzzy_search("interactive", 5));
console.log(mdict.prefix("interactive"));
