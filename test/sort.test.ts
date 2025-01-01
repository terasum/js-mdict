import fs from 'node:fs';
import { MDX } from '../src';

describe('sort-004', () => {
  const input = './test/data/output/oald7.mdx.keylist.txt';
  const mdx = new MDX('./test/data/oald7.mdx',{debug:true});
  it('mdd-full-004-mdx0-foreach', () => {
    const fileContent = fs.readFileSync(input, 'utf8');
    const datalist = [];
    for (const line of fileContent.split('\n')) {
      datalist.push(line.trim());
    }
    let misscount = 0;
    for (let i =1; i < datalist.length; i++) {
      const word1 = datalist[i];
      const word2 = datalist[i - 1];
      const resp = mdx.comp(word1, word2);
      if (resp < 0){
        misscount +=1;
        console.log(`miss-sort word: word[${i}]: ${word1}(${mdx.strip(word1)}), word[${i-1}]: ${word2}(${mdx.strip(word2)}) == ${resp}`);
      }

    }
    console.log(`miss-count ${misscount} `);

  });
});
