import { MDD } from '../src/index';
import fs from 'node:fs';

describe('mdd-full-001', () => {
  const mdd = new MDD('./test/data/Collins.mdd');
  const output = './test/data/output/Collins.mdd.keylist.txt';
  const file = fs.openSync(output, 'w');
  if (fs.statSync(output).size == 0) {
    console.log('Writing keylist to file: ' + output + '\n');
    mdd.keywordList.forEach((element) => {
      fs.writeSync(file, element.keyText + '\n');
    });
  }
  fs.closeSync(file);
  it('mdd-full-001', () => {
    const fileContent = fs.readFileSync(output, 'utf8');
    for (const line of fileContent.split('\n')) {
      if (line.trim() !== '') {
        console.log(`search resource line : ${line}`);
        const resource = mdd.locate(line);
        expect(resource.definition).toBeDefined();
        expect(resource.definition?.length).toBeDefined();
        expect(resource.keyText).toBe(line);
        expect(resource.definition?.length).toBeGreaterThan(0);
      }
    }
  });
});
