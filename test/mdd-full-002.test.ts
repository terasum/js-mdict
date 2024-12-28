import { MDD } from '../src/index';
import fs from 'node:fs';

describe('mdd-full-001', () => {
  const mdd = new MDD('./test/data/oale8.mdd');
  const output = './test/data/output/oale8.mdd.keylist.txt';
  const file = fs.openSync(output, 'w');
  if (fs.statSync(output).size == 0) {
    console.log('Writing keylist to file: ' + output + '\n');
    mdd._decodeKeyBlock();
    mdd.keyList.forEach((element) => {
      fs.writeSync(file, element.keyText + '\n');
    });
  }
  fs.closeSync(file);
  it('mdd-full-002', () => {
    const fileContent = fs.readFileSync(output, 'utf8');
    for (let line of fileContent.split('\n')) {
      if (line.trim() !== '' && line.trim() !== "\\.DS_Store") {
        const resource = mdd.locate(line);
          expect(resource.definition).toBeDefined();
          expect(resource.definition?.length).toBeDefined();
          expect(resource.keyText).toBe(line);
          expect(resource.definition?.length).toBeGreaterThan(0);
      }
    }
  });
});
