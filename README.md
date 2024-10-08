# js-mdict

[![npm version](https://badge.fury.io/js/js-mdict.svg)](https://badge.fury.io/js/js-mdict)
[![GitHub issues](https://img.shields.io/github/issues/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/issues)
[![GitHub forks](https://img.shields.io/github/forks/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/network)
[![GitHub stars](https://img.shields.io/github/stars/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/stargazers)
[![GitHub license](https://img.shields.io/github/license/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/blob/develop/LICENSE)

mdict (\*.mdd \*.mdx) file reader based on [jeka-kiselyov/mdict](https://github.com/jeka-kiselyov/mdict) .

Very thanks to [fengdh](https://github.com/fengdh/mdict-js) and [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict).

## Latest Version

v6.0.0-alpha-2

## Usage

> NOTE: Not Support Browser!

```bash
npm install js-mdict@v6.0.0-alpha-2
```

### ESM

file: `demo.mjs`

```javascript
import { Mdict } from "js-mdict";

const mdict = new Mdict("resources/oald7.mdx", {
  resort: true,
});

const def = mdict.lookup("ask");
console.log(def.definition);


/*
<head><link rel="stylesheet" type="text/css" href="O7.css"/></head><body><span class="hw"> ask </span hw><span class="i_g"> <img src="key.gif"/>  /<a class="i_phon" href="sound://aask_ggv_r1_oa013910.spx">ɑ:sk</a i_phon><span class="z">; </span z><i>NAmE</i> <a class="y_phon" href="sound://aask_ggx_r1_wpu01057.spx">æsk</a y_phon>​/ </span i_g><span class="cls"> verb</span cls><br><span class="sd">QUESTION<span class="chn"> 问题</span chn></span sd>
<div class="define"><span class="numb">1</span numb><span class="cf"> ~ <span class="bra">(</span bra>sb<span class="bra">)</span bra> <span class="bra">(</span bra>about sb/ sth<span class="bra">)</span bra> </span cf><span class="d">to say or write sth in the form of a question, in order to get information<span class="chn"> 问；询问</span chn></span d></div define>
<span class="phrase"><span class="pt">  [<span class="pt_inside">V <span class="pt_bold">speech</span></span><span>]</span> </span pt></span phrase>
<span class="sentence_eng">'Where are you going?' she asked. </span sentence_eng>
<span class="sentence_chi">"你去哪里？"她问道。</span sentence_chi>
<span class="phrase"><span class="pt"> [<span class="pt_inside">VN <span class="pt_bold">speech</span></span><span>]</span> </span pt></span phrase>
<span class="sentence_eng">'Are you sure?' he asked her. </span sentence_eng>
...
</body>
  */
```

### CommonJS

file: `demo.mjs`

```javascript
const { Mdict } = require('js-mdict');

const mdict = new Mdict('resources/oald7.mdx');

const def = mdict.lookup('ask');
console.log(def.definition);

/*
<head><link rel="stylesheet" type="text/css" href="O7.css"/></head><body><span class="hw"> ask </span hw><span class="i_g"> <img src="key.gif"/>  /<a class="i_phon" href="sound://aask_ggv_r1_oa013910.spx">ɑ:sk</a i_phon><span class="z">; </span z><i>NAmE</i> <a class="y_phon" href="sound://aask_ggx_r1_wpu01057.spx">æsk</a y_phon>​/ </span i_g><span class="cls"> verb</span cls><br><span class="sd">QUESTION<span class="chn"> 问题</span chn></span sd>
<div class="define"><span class="numb">1</span numb><span class="cf"> ~ <span class="bra">(</span bra>sb<span class="bra">)</span bra> <span class="bra">(</span bra>about sb/ sth<span class="bra">)</span bra> </span cf><span class="d">to say or write sth in the form of a question, in order to get information<span class="chn"> 问；询问</span chn></span d></div define>
<span class="phrase"><span class="pt">  [<span class="pt_inside">V <span class="pt_bold">speech</span></span><span>]</span> </span pt></span phrase>
<span class="sentence_eng">'Where are you going?' she asked. </span sentence_eng>
<span class="sentence_chi">"你去哪里？"她问道。</span sentence_chi>
<span class="phrase"><span class="pt"> [<span class="pt_inside">VN <span class="pt_bold">speech</span></span><span>]</span> </span pt></span phrase>
<span class="sentence_eng">'Are you sure?' he asked her. </span sentence_eng>
...
</body>
  */
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

## Release

## v6.0.0-alpha

1. implements with TypeScript

BREAKING CHANGES:

1. delete large files in history
2. delete suggest, associate etc. functions.

## v5.0.0

NOTE: This version has a lot of changes, please read the example code example carefully!

注意： 本版本改动了多个 API, 请仔细阅读上方的示例代码。

BREAKING CHANGES:

1. Refactor the key search algorithm: build the keyList first, and resort internally, then search the word
2. The `suggest` method has been deprecated.
3. The `parse_definition` method has been deprecated, use `fetch_definition` instead
4. Delete `nspell` and `en-dictionary-us` dependencies
5. Cleanup unstable compare method and key record compare, won't use `keyInfoBlock.firstKey/lastKey` to locate `recordBlock`
6. Use built-in `TextDecoder` and `zlib`, instead of third party `TextDecoder` and `pako`.
7. use pnpm instead of yarn to manage the dependencies.
8. Have fun!

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

## MDX/MDD Layout

![layout](https://chainlark.oss-cn-beijing.aliyuncs.com/bkun1.svg)

> this picture is from [@ikey4u/wikit](https://github.com/ikey4u/wikit)

code by terasum with ❤️
