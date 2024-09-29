
import { compress } from '../src/lzo1x-wrapper.mjs';


let data = Uint8Array.from([
  0x01,
  0x02,
  0x03,
  0x04,
  0x05,
  0x06,
  0x07,
  0x08,
  0x08,
  0x09,
  0x10,
  0x11,
  0x12,
  0x13,
  ,
  0x11,
  0x12,
  0x13,
]);
let state = {
  inputBuffer: data,
  outBuffer: new Uint8Array(65535),
};
let compressed_data = compress(state);
console.log("compressed data:", compressed_data);

import * as lzo1x from '../src/lzox1-rs/pkg/lzox1_rs.js';

const decompressed_data = lzo1x.decompress(compressed_data);

console.log("original data", data);
console.log("decompressed data", decompressed_data);

if (data.length !== decompressed_data.length) {
  console.log("origin data's length not equal!");
}

for (let i = 0; i < data.length; i++) {
  if (data[i] !== decompressed_data[i]) {
    console.log(`data$[{i}] not equals to compressed_data[${i}]`);
  }
}