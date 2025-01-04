import { assert } from "chai";
import { MDX } from "js-mdict";

const mdict = new MDX("resources/oald7.mdx", {
  resort: true,
});

const def = mdict.lookup("ask");
console.log(def.definition);
assert.isNotEmpty(def.definition);
assert.equal(
  def.keyText,
  "ask",
  "definition result should be equal with `ask`"
);
