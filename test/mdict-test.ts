// import Mdict from "../src/mdict";

// const mdict = new Mdict("resources/oald7.mdx",{
//     resort: true,
//     debug:true,
// })

import fs from 'node:fs';

import { compress, decompress } from '../src/lzo1x-wrapper.ts';

const infile = fs.readFileSync('./test/compressed.data');
console.log(infile);

const data = decompress(infile, 0, 0);
console.log(data);
