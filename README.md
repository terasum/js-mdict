# js-mdict

[![npm version](https://badge.fury.io/js/js-mdict.svg)](https://badge.fury.io/js/js-mdict)
[![GitHub issues](https://img.shields.io/github/issues/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/issues)
[![GitHub forks](https://img.shields.io/github/forks/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/network)
[![GitHub stars](https://img.shields.io/github/stars/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/stargazers)
[![GitHub license](https://img.shields.io/github/license/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/blob/develop/LICENSE)

mdict (\*.mdd \*.mdx) file reader based on [jeka-kiselyov/mdict](https://github.com/jeka-kiselyov/mdict) .

Very thanks to [fengdh](https://github.com/fengdh/mdict-js) and [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict).

## Release

### v4.0.20
1. upgrade xmldom to v0.7.5
### v4.0.19 
1. support rangeKey API

### v4.0.18
1. add rangeKeyBlock interface
2. enhance performance of readKeyBlock

### v4.0.17
1. fix associate can't find special character bug

### v4.0.16
1. fix accurate record start offset parse_definition bug

### v4.0.15

1. fix `findList` return `undefined` will crash the `associate` and `prefix` method bug

### v4.0.14

1. fix babel-runtime dependencies issue

### v4.0.13

1. fix UpperCase key sensitive options logic, details [#41](https://github.com/terasum/js-mdict/issues/41)
2. fix 1.2 mdx keyblock read bug
3. correct some Header properties (StripKey..)

> very thanks to @songxiaocheng

### v4.0.12

1. fix typings declaring and reformat codebase

### v4.0.11

1. fix some `.mdd` file reading issues, and if you search mdd file, use `lookup` method, and it will return base64 data

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
3. _NOT SUPPORT BROWSER CURRENTLY_

### v3.1.0 (2018-08-22)

1. add `fuzzy_search` method, which supports fuzzy word search

## Usage

> not support browser yet

```bash
npm install js-mdict
```

```javascript
import Mdict from 'js-mdict';

// Note: *.mdd file only support lookup method.

// loading dictionary
const dict = new Mdict('mdx/testdict/oale8.mdx');
// console.log(mdict.lookup('interactive'));
// console.log(mdict.bsearch('interactive'));
// console.log(mdict.fuzzy_search('interactive', 5));
// console.log(mdict.prefix('interactive'));

console.log(dict.lookup('hello'));
/*
  { keyText: "hello",
    definition: "你好",
  }
  */

console.log(dict.prefix('hello'));

/*
[
  { key: 'he', rofset: 64744840 },
  { key: 'hell', rofset: 65513175 },
  { key: 'hello', rofset: 65552694 }
]
  */

let word = 'informations';
dict.suggest(word).then((sw) => {
  // eslint-disable-next-line
  console.log(sw);
  /*
    [ 'information', "information's" ]
    */
});

word = 'hitch';
const fws = dict.fuzzy_search(word, 20, 5);
console.log(fws);
/*
[
  { key: 'history', rofset: 66627131, ed: 4 },
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
  { key: 'hit for', rofset: 66713795, ed: 4 }
]

  */
console.log(dict.parse_defination(fws[0].key, fws[0].rofset));
/*

{
  keyText: 'history',
  definition: `<link rel="stylesheet" type="text/css" href="oalecd8e.css"><script src="jquery.js" charset="utf-8" type="text/javascript" language="javascript"></script><script src="oalecd8e.js" charset="utf-8" type="text/javascript" language="javascript"></script><span id="history_e" name="history" idm_id="000017272" class="entry"><span class="h-g"><span class="top-g"><span...
}
  */
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
import Mdict from 'js-mdict';

const mdict = new Mdict('mdx/oale8.mdx');
console.log(mdict.lookup('hello'));
console.log(mdict.prefix('hello'));

// get fuzzy words
fuzzy_words = mdict.fuzzy_search(
  'wrapper',
  5,
  /* fuzzy words size */ 5 /* edit_distance */
);

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
import path from 'path';
import Mdict from 'js-mdict';

const dictPath = path.join(__dirname, '../resource/Collins.mdx');
const mdict = new Mdict(dictPath);
mdict
  .build()
  .then((_mdict) => {
    console.log('hello', _mdict.lookup('hello'));
    console.log('world', _mdict.lookup('world'));
    console.log(_mdict.attr());
  })
  .catch((err) => {
    console.error(err);
  });
```

## MDX/MDD Layout

![layout](https://chainlark.oss-cn-beijing.aliyuncs.com/bkun1.svg)
> this picture is from [@ikey4u/wikit](https://github.com/ikey4u/wikit)

code by terasum with ❤️
