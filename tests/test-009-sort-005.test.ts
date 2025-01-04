import fs from 'node:fs';
import { MDD } from '../src';

const mdd = new MDD('./tests/data/oale8.mdd');
const output = './tests/data/output/oale8.mdd.keylist.txt';
const file = fs.openSync(output, 'w');
if (fs.statSync(output).size == 0) {
  console.log('Writing keylist to file: ' + output + '\n');
  mdd.keywordList.forEach((element) => {
    fs.writeSync(file, element.keyText + '\n');
  });
}
fs.closeSync(file);

it('mdd-full-005-mdd-foreach', () => {
  const fileContent = fs.readFileSync(output, 'utf8');
  const datalist = [];
  for (const line of fileContent.split('\n')) {
    datalist.push(line.trim());
  }
  let misscount = 0;
  for (let i =1; i < datalist.length; i++) {
    const word1 = datalist[i];
    const word2 = datalist[i - 1];
    const resp = mdd.comp(word1, word2);
    if (resp < 0){
      misscount +=1;
      console.log(`miss-sort word: word[${i}]: ${word1}(${mdd.strip(word1)}), word[${i-1}]: ${word2}(${mdd.strip(word2)}) == ${resp}`);
    }

  }
  console.log(`miss-count ${misscount} `);

});
