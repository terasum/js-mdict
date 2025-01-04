import { MDD } from '../dist/cjs/index.js';

const mdx = new MDD('./tests/data/oale8.mdd');
console.log(mdx.header);
console.log(mdx.locate('\\Logo.jpg'));

/*
$ git clone github.com/terasum/js-mdict
$ cd js-mdict
$ npx tsx ./example/oale8-mdd-example.ts

{
  keyText: '\\Logo.jpg',
  definition: '/9j/4AAQSkZJRgABAgAAAQABAAD//gAEKgD/4gIcSUNDX1BST0ZJTEUAAQEAAAIMbGNtcwIQ...'
 }
*/
