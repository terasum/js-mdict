import Mdict from '../src/mdict';

// Note: *.mdd file only support lookup method.

const dict = new Mdict('mdx/testdict/oale8.mdd');

const data = dict.lookup('jquery.js');
console.log(data.keyText);
console.log(data.definition);
