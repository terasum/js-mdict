import  Benchmark from 'benchmark';
import { MDX } from '../../dist/cjs/mdx.js';

const suite = new Benchmark.Suite();

// loading dictionary
const startTime = new Date().getSeconds();
const mdict = new MDX('../data/oale8.mdx');
const endTime = new Date().getSeconds();
// eslint-disable-next-line
console.log(`Mdict#loading time: ${endTime - startTime} sec`);

// add tests
suite
  .add('Mdict#lookup', () => {
    mdict.lookup('incited');
  })
  .add('Mdict#prefix', () => {
    mdict.prefix('incited');
  })
  .add('Mdict#associate', () => {
    mdict.associate('on');
  })
  // add listeners
  .on('cycle', (event: { target: any; }) => {
    // eslint-disable-next-line no-console
    console.log(String(event.target));
  })
  .on('complete', function cb() {
  })
  // run async
  .run({ async: true });