import { MDX } from '../src/index';
import fs from 'node:fs';

describe('mdd-full-004', () => {
  const mdx = new MDX('./tests/data/oald7.mdx',{debug:true});
  const output = './tests/data/output/oald7.mdx.keylist.txt';
  const file = fs.openSync(output, 'w');
  if (fs.statSync(output).size == 0) {
    console.log('Writing keylist to file: ' + output + '\n');
    mdx.keywordList.forEach((element) => {
      fs.writeSync(file, element.keyText + '\n');
    });
  }
  fs.closeSync(file);
  it('mdd-full-004-mdx0-foreach', () => {
    const fileContent = fs.readFileSync(output, 'utf8');
    for (const line of fileContent.split('\n')) {
      if (line.trim() !== '' && line.trim() !== '\\.DS_Store') {
        const def = mdx.lookup(line.trim());
        expect(def.definition).toBeDefined();
        expect(def.keyText).toBe(line);
      }
    }
  });
});
