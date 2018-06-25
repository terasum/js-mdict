import Mdict from "../src/index";

// const mdict = new Mdict2("mdx/ETDict.mdx");
const mdict = new Mdict("mdx/oale8.mdx");
for (let i = 0; i < 100; i++) {
  mdict.lookup("youse");
  mdict.lookup("yous");
}
