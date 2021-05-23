import { expect } from "chai";

import Mdict from "../src/mdict";

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);
  console.log(mdict.lookup("hello"));
  /*
  { keyText: "hello",
    definition: "你好",
  }
  */
  console.log(mdict.prefix("hello"));
  /*
  [ { v: 64744840, k: 'he' },
  { v: 65513175, k: 'hell' },
  { v: 65552694, k: 'hello' } ]
  */

  let word = "informations";
  mdict.suggest(word).then((sw) => {
    // eslint-disable-next-line
    console.log(sw);
    // [ 'INFORMATION\'S', 'information' ]
  });

  word = "hitch";
  const fws = mdict.fuzzy_search(word, 20, 5);
  console.log(fws);
  /*
 [ { key: 'history', rofset: 66627131, ed: 4 },
  { key: 'hit', rofset: 66648124, ed: 2 },
  { key: 'hit back', rofset: 66697464, ed: 4 },
  { key: 'hit back', rofset: 66697464, ed: 4 },
  { key: 'hit big', rofset: 66698789, ed: 4 },
  { key: 'hitch', rofset: 66698812, ed: 0 },
  { key: 'hitched', rofset: 66706586, ed: 2 },
  { key: 'hitcher', rofset: 66706602, ed: 2 },
  { key: 'hitches', rofset: 66706623, ed: 2 },
  { key: 'hitchhike', rofset: 66706639, ed: 4 },
  { key: 'hitchhiker', rofset: 66710697, ed: 5 },
  { key: 'hitching', rofset: 66712273, ed: 3 },
  { key: 'hi-tech', rofset: 66712289, ed: 2 },
  { key: 'hit for', rofset: 66713795, ed: 4 } ]

  */
  console.log(mdict.parse_defination(fws[0].key, fws[0].rofset));
  /*
  {}
  */

  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  // eslint-disable-next-line
  console.log(`loading ${dictName} dict used: ${(elapsedTime) / 1000.0} s`);
}


function debugSearch(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);
  const wordIndex = mdict.lookup(word);
  const endTime = new Date().getTime();
  console.log(`time costs ${endTime - startTime} ms, wordIndex ${wordIndex}`);
  callback(wordIndex);
  
}


function debugStripKey(dictName, dictPath, word, callback) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);
  const stripfn = mdict._stripKey();
  console.log(`stripKey fn: ${stripfn}`);
  const strippedKey = stripfn(word);
  const endTime = new Date().getTime();
  console.log(`time costs ${endTime - startTime} ms, strippedKey: ${strippedKey}`);
  callback(strippedKey);
}


!function(){
  // debug case 1:
  // recorder("oale8", "mdx/oale8.mdx", (mdict) => {
  //   expect(mdict._version).to.be.equal(2);
  // });

  // debug case 2
  // https://github.com/terasum/js-mdict/pull/27
  debugSearch('dict-01-phhp','mdx/dict-01-phhp.mdx', 'holanda', (wordIndex) =>{
    console.log(wordIndex);
  });

  // debug case 3
  // https://github.com/terasum/js-mdict/pull/27
  debugSearch('dict-01-phhp','mdx/dict-01-phhp.mdx', 'Holanda', (wordIndex) =>{
    console.log(wordIndex);
  })

  // debug case 4
  debugStripKey('dict-01-phhp','mdx/dict-01-phhp.mdx', 'Holanda', (strippedKey) =>{
    console.log(strippedKey);
  })
  // debug case 5
  debugStripKey('dict-01-phhp','mdx/dict-01-phhp.mdx', 'holanda', (strippedKey) =>{
    console.log(strippedKey);
  })


}();


