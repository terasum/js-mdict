import { assert } from 'chai';
import Mdict from '../src/mdict';

// loading dictionary
const startTime = new Date().getSeconds();
const mdict = new Mdict('mdx/testdict/oale8.mdx');
const endTime = new Date().getSeconds();
// eslint-disable-next-line
console.log(`Mdict#loading time: ${endTime - startTime} sec`);

const matched = mdict.associate('on');
assert.isTrue(matched.length > 0);

let defination = mdict.parse_defination(
  matched[0].keyText,
  matched[0].recordStartOffset
);
assert.isTrue(
  defination.definition.startsWith('<link rel="stylesheet" type="text/css" ')
);
