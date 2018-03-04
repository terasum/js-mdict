# mdict
mdict (*.mdd *.mdx) file reader based on https://github.com/jeka-kiselyov/mdict, improvement includes :
# VERSION 2.0.0
improvements:
1. ES6 implements
2. rewrite the decode code, more readable decode api
3. *NOT SUPPORT BROWSER CURRENTLY*

VERY THANKS TO [fengdh](https://github.com/fengdh/mdict-js) and  [jeka-kiselyov](https://github.com/jeka-kiselyov/mdict)
# usage

```bash
npm install js-mdict
```

## in browser:
NOT SUPPORT YET

## in Node.js

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
