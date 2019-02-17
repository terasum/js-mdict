import { expect } from "chai";
import struct from "python-struct";


import Mdict from "../src";

console.log(struct.pack("<L", 0x3695));

function recorder(dictName, dictPath, func) {
  const startTime = new Date().getTime();
  const mdict = new Mdict(dictPath);
  const endTime = new Date().getTime();
  const elapsedTime = endTime - startTime;
  func(mdict, elapsedTime);
  console.log(`loading ${dictName} dict used: ${(elapsedTime) / 1000.0} s`);
}

recorder("oale8", "mdx/oale8.mdx", (mdict) => {
  expect(mdict._version).to.be.equal(2);
});

