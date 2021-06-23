import { assert } from 'chai';
import Mdict from '../src/mdict';

it('oale8 parse_definition should start with correct content', () => {
  // loading dictionary
const mdict = new Mdict('mdx/testdict/oale8.mdx');
const matched = mdict.associate('on');
  assert.isTrue(matched.length > 0);
  assert.isTrue(matched != undefined);
  assert.isTrue(matched[0]!= undefined);
  
let defination = mdict.parse_defination(matched[0].keyText, matched[0].recordStartOffset);

assert.isTrue(
  defination.definition.startsWith('<link rel="stylesheet" type="text/css" ')
);
})