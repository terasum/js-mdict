# js-mdict

[![npm version](https://badge.fury.io/js/js-mdict.svg)](https://badge.fury.io/js/js-mdict)
[![GitHub issues](https://img.shields.io/github/issues/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/issues)
[![GitHub forks](https://img.shields.io/github/forks/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/network)
[![GitHub stars](https://img.shields.io/github/stars/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/stargazers)
[![GitHub license](https://img.shields.io/github/license/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/blob/develop/LICENSE)


mdict (*.mdd *.mdx) file reader based on [jeka-kiselyov/mdict](https://github.com/jeka-kiselyov/mdict) .

Very thanks to [fengdh](https://github.com/fengdh/mdict-js) and  [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict).

## Release

### v4.0.10
1. rewrite `typings/mdict.d.ts`

### v4.0.9
1. rename `typings/Mdict.d.ts` to `typings/mdict.d.ts`

### v4.0.8
1. fix uppercase words comparing missed bug
2. fix `out of index error` when cannot locate word offset
3. if cannot find the word key block, return `undefined`

### v4.0.7
1. rename Mdict.js to mdict.js , rename MdictBase.js to mdict-base.js, fix import error on ubuntu.

### v4.0.6

1. support search words by prefix `associate` (the phrase as the words' prefix, not the phrase's prefix as search token just like `prefix` function)
2. some security updates

> very thanks to @Danjame

### v4.0.x

1. ES6 implemention
2. rewrite the decode code, more readable decode api
3. *NOT SUPPORT BROWSER CURRENTLY*

### v3.1.0 (2018-08-22)

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

  const matched = mdict.associate("on");
  console.log(matched);
  /*
[
  { recordStartOffset: 97048935, keyText: 'on' },
  { recordStartOffset: 97082810, keyText: 'on about' },
  { recordStartOffset: 97082836, keyText: 'on account' },
  { recordStartOffset: 97085518, keyText: 'on account of' },
  { recordStartOffset: 97085549, keyText: 'on account of sb' },
  { recordStartOffset: 97085580, keyText: 'on account of sb/sth' },
  { recordStartOffset: 97086890, keyText: 'on account of sth' },
  { recordStartOffset: 97086921, keyText: 'on a collision course' },
  { recordStartOffset: 97086970, keyText: 'on aggregate' },
  { recordStartOffset: 97088131, keyText: 'on a hiding to nothing' },
  { recordStartOffset: 97089084, keyText: 'on-air' },
  { recordStartOffset: 97091515, keyText: 'on air' },
  { recordStartOffset: 97091538, keyText: 'on a knife-edge' },
  { recordStartOffset: 97093165, keyText: 'on all fours' },
  { recordStartOffset: 97094283, keyText: 'on all sides' },
  { recordStartOffset: 97094311, keyText: 'on and off' },
  { recordStartOffset: 97094343, keyText: 'on and on' },
  { recordStartOffset: 97095318, keyText: 'on a need-to-know basis' },
  { recordStartOffset: 97096498, keyText: 'on an even keel' },
  { recordStartOffset: 97097359, keyText: 'onanism' },
  { recordStartOffset: 97099666, keyText: 'on a par with' },
  { recordStartOffset: 97099697, keyText: 'on a par with sb' },
  { recordStartOffset: 97099728, keyText: 'on a par with sb/sth' },
  { recordStartOffset: 97100535, keyText: 'on a par with sth' },
  { recordStartOffset: 97100566, keyText: 'on a razor edge' },
  { recordStartOffset: 97100595, keyText: 'on a roll' },
  { recordStartOffset: 97100618, keyText: 'on a shoestring' },
  { recordStartOffset: 97101718, keyText: 'on a short fuse' },
  { recordStartOffset: 97101747, keyText: 'on a silver platter' },
  { recordStartOffset: 97102883, keyText: 'on at to do' },
  { recordStartOffset: 97102915, keyText: 'on automatic pilot' },
  { recordStartOffset: 97102947, keyText: 'on a wing and a prayer' },
  ... 400+ more items
]
  */
  console.log(mdict.parse_defination(matched[0].keyText, matched[0].recordStartOffset));

```

## Benchmark

```
Mdict#loading time: 0 sec
Mdict#lookup x 34.17 ops/sec ±0.52% (59 runs sampled)
wooorm#levenshtein x 173,386 ops/sec ±1.51% (88 runs sampled)
Mdict#prefix x 26.98 ops/sec ±5.89% (47 runs sampled)
Mdict#fuzzy_search x 6.89 ops/sec ±8.83% (22 runs sampled)
Mdict#associate x 16.59 ops/sec ±2.94% (44 runs sampled)
Fastest is Mdict#lookup
```

## Note

**depreciate** if you use js-mdict@3.x, please upgrade to js-mdict@4.0.5+,
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