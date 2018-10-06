import { expect } from "chai";

import Mdict from "../src";

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);
  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  console.log(`loading ${dictName} dict used: ${(elapsedTime) / 1000.0} s`);
}

const totalTime = [];

for (let i = 0; i < 10; i++) {
  recorder("oale8", "mdx/oale8.mdx", (mdict, elapsedTime) => {
    totalTime.push(elapsedTime);
    expect(mdict._version).to.be.equal(2);
  });
}
const avgTime = totalTime.reduce((prev, cur) => prev + cur) / totalTime.length;
console.log(`average load time:${avgTime / 1000.0} s`);

