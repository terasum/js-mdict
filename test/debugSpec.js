import { expect } from "chai";

import Mdict from "../src/Mdict";

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);

  const word = "hellos";
  const data = mdict.lookup(word);
  console.log(data);

  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  console.log(`loading ${dictName} dict used: ${(elapsedTime) / 1000.0} s`);
}

recorder("oale8", "mdx/oale8.mdx", (mdict) => {
  expect(mdict._version).to.be.equal(2);
});

