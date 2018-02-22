import path from "path";
// import OldDict from "./index";
import Parser from "./Parser";
import common from "./common";

(() => {
  const dictPath = path.join(__dirname, "../resource/ETDict.mdx");
  // const old = new OldDict(dictPath);
  // old.search("hello").then((data) => { console.debug("[o]", data); });
  const parser = new Parser(dictPath, common.getExtension(dictPath, "mdx"));
  parser.parse().then((mdx) => {
    console.log(mdx.keyList);
  });
})();
