import path from "path";
// import OldDict from "../old/index";
// import Parser from "./Parser";
// import common from "./common";
import Mdict from "./mdict";


// const dictPath = path.join(__dirname, "../resource/ETDict.mdx");
// const dictPath = path.join(__dirname, "../resource/21century.mdx");
const dictPath = path.join(__dirname, "../mdx/oale8.mdx");
// const dictPath = path.join(__dirname, "../resource/bing.mdx");
// WRONG TODO:: FIX THIS
// const dictPath = path.join(__dirname, "../resource/msbing.mdx");
// WRONG TODO:: FIX THIS
// const dictPath = path.join(__dirname, "../resource/vcd.mdx");

// const start0 = Date.now();
// const old = new OldDict(dictPath);
// const stagea = Date.now();
// old.search("hello").then((data) => {
//   console.log("[o]","old", Date.now() - stagea);
//   const stageb = Date.now();
//   old.search("world").then((data2) => { console.log("[o]","old", Date.now() - stageb); });
// });

// const parser = new Parser(dictPath, common.getExtension(dictPath, "mdx"));
// parser.parse().then((mdx) => {
//   console.log(mdx.keyList);
// });

const mdict = new Mdict(dictPath);
// const loadtime = Date.now();

mdict.build().then((_mdict) => {
  console.log("hello", _mdict.lookup("hello"));
  console.log("world", _mdict.lookup("world"));
  console.log("world", _mdict.attr());
}).catch((err) => { console.error(err); });
