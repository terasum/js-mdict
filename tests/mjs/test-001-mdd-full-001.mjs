import { MDD } from '../dist/esm/index.js';
import fs from 'node:fs';

const mdd = new MDD('./tests/data/oale8.mdd');
const output = './tests/data/output/oale8.mdd.keylist-2.txt';

const file = fs.openSync(output, 'w');
if (fs.statSync(output).size == 0) {
  console.log('Writing keylist to file: ' + output + '\n');
  mdd._decodeKeyBlock();
  mdd.keyList.forEach((element) => {
    fs.writeSync(file, element.keyText + '\n');
  });
}
fs.closeSync(file);

const fileContent = fs.readFileSync(output, 'utf8');
for (let line of fileContent.split('\n')) {
  if (line.trim() !== '' && line.trim() !== '\\.DS_Store') {
    const resource = mdd.locate(line);
    if (!resource.definition)
      throw new Error(`No definition found for ${line}`);
  }
}
