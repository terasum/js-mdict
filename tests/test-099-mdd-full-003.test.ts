import { MDD } from '../src/index';
import fs from 'node:fs';

describe('mdd-full-003', () => {
  const mdd = new MDD('./tests/data/Collins.mdx');
  const output = './tests/data/output/Collins.mdx.keylist.txt';
  const file = fs.openSync(output, 'w');
  if (fs.statSync(output).size == 0) {
    console.log('Writing keylist to file: ' + output + '\n');
    mdd.keywordList.forEach((element) => {
      fs.writeSync(file, element.keyText + '\n');
    });
  }
  fs.closeSync(file);
  it('mdd-full-003', () => {
    const fileContent = fs.readFileSync(output, 'utf8');
    let count = 0;
    for (const line of fileContent.split('\n')) {
      if (line.trim() !== '') {
        const resource = mdd.lookupKeyBlockByWord(line);
        if (resource && resource.keyText && resource.keyText.length>0) {
          count++;
        }
      }
      expect(count).toBeGreaterThan(0);
    }
  });
});
