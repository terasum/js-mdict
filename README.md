# js-mdict

[![npm version](https://badge.fury.io/js/js-mdict.svg)](https://badge.fury.io/js/js-mdict)
[![GitHub issues](https://img.shields.io/github/issues/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/issues)
[![GitHub forks](https://img.shields.io/github/forks/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/network)
[![GitHub stars](https://img.shields.io/github/stars/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/stargazers)
[![GitHub license](https://img.shields.io/github/license/terasum/js-mdict.svg)](https://github.com/terasum/js-mdict/blob/develop/LICENSE)


mdict (*.mdd *.mdx) file reader based on [jeka-kiselyov/mdict](https://github.com/jeka-kiselyov/mdict) .

Very thanks to [fengdh](https://github.com/fengdh/mdict-js) and  [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict).

## RELEASE

### Ver. 3.0.0

1. ES6 implements
2. rewrite the decode code, more readable decode api
3. *NOT SUPPORT BROWSER CURRENTLY*

### Ver 3.1.0 (2018-08-22)

1. add `fuzzy_search` method, which support fuzzy word search

## USAGE

```bash
npm install js-mdict
```

### IN BROWSER

NOT SUPPORT YET

### IN NODE.JS

```javascript
import Mdict from "js-mdict";

const mdict = new Mdict("mdx/oale8.mdx");
console.log(mdict.lookup("hello"));
console.log(mdict.prefix("hello"));

console.log(mdict.fuzzy_search("word", 5 /* edit_distance */));

```

## NOTE

**Depreciate** if you use js-mdict @2.0.3, you can use api shown below:

> Note: 2.0.3 not support mdd file, and record info encrypted file

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