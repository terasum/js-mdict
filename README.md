# js-mdict

[![npm version](https://badge.fury.io/js/js-mdict.svg)](https://badge.fury.io/js/js-mdict)
[![GitHub issues](https://img.shields.io/github/issues/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/issues)
[![GitHub forks](https://img.shields.io/github/forks/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/network)
[![GitHub stars](https://img.shields.io/github/stars/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/stargazers)
[![GitHub license](https://img.shields.io/github/license/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/blob/develop/LICENSE)


mdict (*.mdd *.mdx) file reader based on [jeka-kiselyov/mdict](https://github.com/jeka-kiselyov/mdict) .

Very thanks to [fengdh](https://github.com/fengdh/mdict-js) and  [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict).

## Release

### Ver. 3.0.0

1. ES6 implemention
2. rewrite the decode code, more readable decode api
3. *NOT SUPPORT BROWSER CURRENTLY*

### Ver 3.1.0 (2018-08-22)

1. add `fuzzy_search` method, which supports fuzzy word search

## Usage

> not support browser yet

```bash
npm install js-mdict
```

```javascript
import Mdict from "js-mdict";

const mdict = new Mdict("mdx/oale8.mdx");
console.log(mdict.lookup("hello"));
console.log(mdict.prefix("hello"));

// get fuzzy words
fuzzy_words = mdict.fuzzy_search("wrapper", 5, /* fuzzy words size */ 5, /* edit_distance */);

/*
example output:
[ { ed: 0, idx: 108605, key: 'wrapper' },
  { ed: 1, idx: 108603, key: 'wrapped' },
  { ed: 1, idx: 108606, key: 'wrappers' },
  { ed: 3, idx: 108593, key: 'wrangler' },
  { ed: 3, idx: 108598, key: 'wrap' },
  { ed: 3, idx: 108607, key: 'wrapping' },
  { ed: 4, idx: 108594, key: 'wranglers' },
  { ed: 4, idx: 108595, key: 'wrangles' },
  { ed: 4, idx: 108609, key: 'wrappings' } ]
*/
// get definition
console.log(mdict.parse_defination(fuzzy_words[0].idx));


```

## Benchmark

```
Mdict#lookup x 1,786 ops/sec ±12.35% (67 runs sampled)
Mdict#bsearch x 1,710 ops/sec ±11.88% (65 runs sampled)
Mdict#fuzzySearch x 21,121 ops/sec ±5.94% (76 runs sampled)
Mdict#prefix x 336,520 ops/sec ±19.50% (64 runs sampled)
Fastest is Mdict#prefix
```

## Note

**depreciate** if you use js-mdict @2.0.3, you can use api shown below:

> Note: 2.0.3 not supports mdd file, and record info encrypted file

```javascript
import path from "path";
import Mdict from "js-mdict";

const dictPath = path.join(__dirname, "../resource/Collins.mdx");
const mdict = new Mdict(dictPath);
mdict.build().then((_mdict) => {
  console.log("hello", _mdict.lookup("hello"));
  console.log("world", _mdict.lookup("world"));
  console.log( _mdict.attr());
}).catch((err) => { console.error(err); });
```

code by terasum with ❤️