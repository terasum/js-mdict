import { assert } from "chai";
import { MDX } from "js-mdict";
import path from "path";
import fs from "fs";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const mdxPath = path.join(__dirname, "../resources/new-oxford-en-ch-dict.mdx");

const mdict = new MDX(mdxPath);

const word = "be";
const def = mdict.lookup(word);
console.log(def.definition);
assert.isNotEmpty(def.definition);
assert.equal(
  def.keyText,
  word,
  `definition result should be equal to ${word} `
);

assert.isTrue(def.definition.includes(word));
const outputfile = path.join(__dirname, `新牛津英汉双解大词典-${word}.html`);
fs.writeFileSync(outputfile, def.definition);

