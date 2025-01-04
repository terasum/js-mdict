import {MDX} from '../dist/cjs/index.js';

const mdx = new MDX('./tests/data/new-oxford-en-ch-dict.mdx');
console.log(mdx.header);
console.log(mdx.lookup('be'));

/*
$ git clone github.com/terasum/js-mdict
$ cd js-mdict
$ npx tsx ./example/new-oxford-en-ch-example.ts
*/
