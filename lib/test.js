"use strict";

var _path = require("path");

var _path2 = _interopRequireDefault(_path);

var _mdict2 = require("./mdict");

var _mdict3 = _interopRequireDefault(_mdict2);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

// const dictPath = path.join(__dirname, "../resource/ETDict.mdx");
// const dictPath = path.join(__dirname, "../resource/21century.mdx");
const dictPath = _path2.default.join(__dirname, "../mdx/oale8.mdx");
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

// import OldDict from "../old/index";
// import Parser from "./Parser";
// import common from "./common";
const mdict = new _mdict3.default(dictPath);
// const loadtime = Date.now();

mdict.build().then(_mdict => {
  console.log("hello", _mdict.lookup("hello"));
  console.log("world", _mdict.lookup("world"));
  console.log("world", _mdict.attr());
}).catch(err => {
  console.error(err);
});