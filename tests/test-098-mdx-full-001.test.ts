import { MDD } from '../src/index';
import fs from 'node:fs';

describe('mdx-full-001', () => {
  const mdd = new MDD('./tests/data/tahdel.mdd',{debug:true});
  const output = './tests/data/output/tahdel.mdd.keylist.txt';
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
    for (const line of fileContent.split('\n')) {
      if (line.trim() !== '' && line.trim() !== '\\.DS_Store') {
        const resource = mdd.locate(line);
        if (!resource.definition){
          console.log(resource);
        }
        expect(resource.definition).toBeDefined();
        expect(resource.definition?.length).toBeDefined();
        expect(resource.keyText).toBe(line);
        expect(resource.definition?.length).toBeGreaterThan(0);
      }
    }
  });
});
