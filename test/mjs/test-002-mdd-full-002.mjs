import { MDD } from '../dist/esm/index.js';
import fs from 'node:fs';

const mdd = new MDD('./test/data/Collins.mdd', {
});
const output = './test/data/output/Collins.mdd.keylist.txt';

const file = fs.openSync(output, 'w');
if (fs.statSync(output).size == 0) {
  console.log('Writing keylist to file: ' + output + '\n');
  mdd._decodeKeyBlock();
  mdd.keyList.forEach((element) => {
    fs.writeSync(file, element.keyText + '\n');
  });
}
fs.closeSync(file);