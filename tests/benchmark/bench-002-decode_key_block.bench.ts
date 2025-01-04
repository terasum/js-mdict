import { expect } from 'chai';
import Mdict from '../../src/mdict';

/**
 *
 * @param {*} dictName dictionary name
 * @param {*} dictPath dictionary path
 * @param {*} func callback function
 * average load time:0.0124 s
 * average decode time:2.1612 s
 */
function recorder(dictName: string, dictPath: string, func: { (mdict: any, elapsedTime: any, decodeTime: any): void; (arg0: Mdict, arg1: number, arg2: number, arg3: any): void; }) {
  const startTime = new Date().getTime();
  // main test part
  const mdict = new Mdict(dictPath);
  const endTime = new Date().getTime();
  const loadTime = endTime - startTime;
  const startDecodeTime = new Date().getTime();
  mdict._readRecordBlocks();
  const endDecodeTime = new Date().getTime();
  const decodeKeyBlockTime = endDecodeTime - startDecodeTime;
  func(mdict, loadTime, decodeKeyBlockTime);
  console.log(`loading ${dictName} dict used: ${loadTime / 1000.0} s, decode Keyblock ${decodeKeyBlockTime/1000.0} s`);
}

const totalTime: any[] = [];
const totalDecodeTime: any[] = [];

for (let i = 0; i < 10; i++) {
  recorder('oale8', '../data/oale8.mdx', (mdict, elapsedTime, decodeTime) => {
    totalTime.push(elapsedTime);
    totalDecodeTime.push(decodeTime);
    expect(mdict.meta.version).to.be.equal(2);
  });
}
const avgTime = totalTime.reduce((prev, cur) => prev + cur) / totalTime.length;
const avgDecodeTime = totalDecodeTime.reduce((prev, cur) => prev + cur) / totalDecodeTime.length;
console.log(`average load time:${avgTime / 1000.0} s`);
console.log(`average decode time:${avgDecodeTime / 1000.0} s`);
