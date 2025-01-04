const { MDX } = require("js-mdict");

const mdict = new MDX("resources/oald7.mdx");

const def = mdict.lookup("ask");
console.log(def.definition);
