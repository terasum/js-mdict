import { expect } from "chai";

import Mdict from "../src/Mdict";

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);

  const word = "hitch";
  mdict.suggest(word).then((data) => {
    // eslint-disable-next-line
    console.log(data);
  });

  const fws = mdict.fuzzy_search(word, 20, 5);

  console.log(fws[0]);
  console.log(mdict.parse_defination(fws[0].key, fws[0].rofset));

  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  // eslint-disable-next-line
  console.log(`loading ${dictName} dict used: ${(elapsedTime) / 1000.0} s`);
}

recorder("oale8", "mdx/oale8.mdx", (mdict) => {
  expect(mdict._version).to.be.equal(2);
});

