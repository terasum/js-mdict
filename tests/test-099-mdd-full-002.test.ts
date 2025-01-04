import { MDD } from '../src';
import fs from 'node:fs';

describe('mdd-full-001', () => {
  const mdd = new MDD('./tests/data/oale8.mdd', {debug: true});
  console.log(mdd.header);
  console.log(mdd.recordHeader);
  console.log(mdd.recordBlockDataList.slice(0,10));
  const output = './tests/data/output/oale8.mdd.keylist.txt';
  const file = fs.openSync(output, 'w');
  if (fs.statSync(output).size == 0) {
    console.log('Writing keylist to file: ' + output + '\n');
    mdd.keywordList.forEach((element) => {
      fs.writeSync(file, element.keyText + '\n');
    });
  }
  fs.closeSync(file);
  it('mdd-full-002', () => {
    const fileContent = fs.readFileSync(output, 'utf8');
    let count = 0;
    let lineCount = 0;
    for (const line of fileContent.split('\n')) {
      lineCount++;
      if (line.trim() !== '' && line.trim() !== '\\.DS_Store') {
        const resource = mdd.locate(line);
        expect(resource.definition).toBeDefined();

        if (!resource.definition) {
          console.log('undefined word:', { resource });
        }
        expect(resource.definition?.length).toBeDefined();
        expect(resource.keyText).toBe(line);

        if (!resource.definition || resource.definition.length<=0) {
          count += 1;
        }
        // expect(resource.definition?.length).toBeGreaterThan(0);
      }
    }
    expect(count).toBeLessThan(lineCount);
  });
});
