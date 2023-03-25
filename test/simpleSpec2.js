const Mdict = require("../lib/mdict").default;

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath, {
    passcode: "",
    debug: true,
    resort: true,
    isStripKey: true,
    isCaseSensitive: false,
  });

  console.log(mdict._lookupByResort("let yourself in for sth"));

  //   console.log(mdict.lookup("hello"));
  //   /*
  //   { keyText: "hello",
  //     definition: "你好",
  //   }
  //   */
  //   console.log(mdict.prefix("hello"));
  //   /*
  //   [ { v: 64744840, k: 'he' },
  //   { v: 65513175, k: 'hell' },
  //   { v: 65552694, k: 'hello' } ]
  //   */

  //   const word = "hitch";
  //   const fws = mdict.fuzzy_search(word, 20, 5);
  //   console.log(fws);
  //   /*
  //  [ { key: 'history', rofset: 66627131, ed: 4 },
  //   { key: 'hit', rofset: 66648124, ed: 2 },
  //   { key: 'hit back', rofset: 66697464, ed: 4 },
  //   { key: 'hit back', rofset: 66697464, ed: 4 },
  //   { key: 'hit big', rofset: 66698789, ed: 4 },
  //   { key: 'hitch', rofset: 66698812, ed: 0 },
  //   { key: 'hitched', rofset: 66706586, ed: 2 },
  //   { key: 'hitcher', rofset: 66706602, ed: 2 },
  //   { key: 'hitches', rofset: 66706623, ed: 2 },
  //   { key: 'hitchhike', rofset: 66706639, ed: 4 },
  //   { key: 'hitchhiker', rofset: 66710697, ed: 5 },
  //   { key: 'hitching', rofset: 66712273, ed: 3 },
  //   { key: 'hi-tech', rofset: 66712289, ed: 2 },
  //   { key: 'hit for', rofset: 66713795, ed: 4 } ]

  //   */
  //   console.log(mdict.parse_defination(fws[0].key, fws[0].rofset));

  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  // eslint-disable-next-line
  console.log(`loading ${dictName} dict used: ${elapsedTime / 1000.0} s`);
}

recorder("01-oale8", "mdx/testdict/oale8.mdx", (mdict) => {
  console.log("01-oale8 version", mdict._version);
});
