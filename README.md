# js-mdict

[![npm version](https://badge.fury.io/js/js-mdict.svg)](https://badge.fury.io/js/js-mdict)
[![GitHub issues](https://img.shields.io/github/issues/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/issues)
[![GitHub forks](https://img.shields.io/github/forks/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/network)
[![GitHub stars](https://img.shields.io/github/stars/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/stargazers)
[![GitHub license](https://img.shields.io/github/license/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/blob/develop/LICENSE)


mdict (*.mdd *.mdx) file reader based on [jeka-kiselyov/mdict](https://github.com/jeka-kiselyov/mdict) .

Very thanks to [fengdh](https://github.com/fengdh/mdict-js) and  [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict).

## Release

### Ver. 4.0.x

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
const mdict = new Mdict(dictPath);
  console.log(mdict.lookup("hello"));
  /*
  { keyText: "hello",
    definition: "你好",
  }
  */
  console.log(mdict.prefix("hello"));
  /*
  [ { roffset: 64744840, key: 'he' },
  { roffset: 65513175, key: 'hell' },
  { roffset: 65552694, key: 'hello' } ]
  */

  let word = "informations";
  mdict.suggest(word).then((sw) => {
    // eslint-disable-next-line
    console.log(sw);
    // [ 'INFORMATION\'S', 'information' ]
  });

  word = "hitch";
  const fws = mdict.fuzzy_search(word, 20, 5);
  console.log(fws);
  /*
 [ { key: 'history', rofset: 66627131, ed: 4 },
  { key: 'hit', rofset: 66648124, ed: 2 },
  { key: 'hit back', rofset: 66697464, ed: 4 },
  { key: 'hit back', rofset: 66697464, ed: 4 },
  { key: 'hit big', rofset: 66698789, ed: 4 },
  { key: 'hitch', rofset: 66698812, ed: 0 },
  { key: 'hitched', rofset: 66706586, ed: 2 },
  { key: 'hitcher', rofset: 66706602, ed: 2 },
  { key: 'hitches', rofset: 66706623, ed: 2 },
  { key: 'hitchhike', rofset: 66706639, ed: 4 },
  { key: 'hitchhiker', rofset: 66710697, ed: 5 },
  { key: 'hitching', rofset: 66712273, ed: 3 },
  { key: 'hi-tech', rofset: 66712289, ed: 2 },
  { key: 'hit for', rofset: 66713795, ed: 4 } ]

  */
  console.log(mdict.parse_defination(fws[0].key, fws[0].rofset));

```

## Benchmark

```
Mdict#loading time: 0 sec
Mdict#lookup x 11.95 ops/sec ±5.33% (39 runs sampled)
Mdict#prefix x 12.80 ops/sec ±4.67% (34 runs sampled)
Mdict#fuzzy_search x 2.82 ops/sec ±9.73% (12 runs sampled)
```

## Note

**depreciate** if you use js-mdict@3.x, please upgrade to js-mdict@4.0.3+,
because js-mdict@3.x was loaded the whole dictionary data to build the index,
took a lot of time.

and the api has already changed, please do not use that version.

the api of js-mdict@3.x:

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