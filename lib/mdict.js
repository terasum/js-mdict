"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _pythonStruct = require("python-struct");

var _pythonStruct2 = _interopRequireDefault(_pythonStruct);

var _readChunk = require("read-chunk");

var _readChunk2 = _interopRequireDefault(_readChunk);

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

var _doublearray = require("doublearray");

var _doublearray2 = _interopRequireDefault(_doublearray);

var _bl = require("bl");

var _bl2 = _interopRequireDefault(_bl);

var _pako = require("pako");

var _pako2 = _interopRequireDefault(_pako);

var _long = require("long");

var _long2 = _interopRequireDefault(_long);

var _lzo = require("lzo");

var _lzo2 = _interopRequireDefault(_lzo);

var _bufferToArraybuffer = require("buffer-to-arraybuffer");

var _bufferToArraybuffer2 = _interopRequireDefault(_bufferToArraybuffer);

var _textEncoding = require("text-encoding");

var _xmldom = require("xmldom");

var _Parser = require("./Parser");

var _Parser2 = _interopRequireDefault(_Parser);

var _common = require("./common");

var _common2 = _interopRequireDefault(_common);

var _lzoWrapper = require("./lzo-wrapper");

var _lzoWrapper2 = _interopRequireDefault(_lzoWrapper);

var _ripemd = require("./ripemd128");

var _ripemd2 = _interopRequireDefault(_ripemd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
const UTF16 = "UTF-16";

const UTF_8_DECODER = new _textEncoding.TextDecoder("utf-8");
const UTF8 = "UTF-8";

const BIG5_DECODER = new _textEncoding.TextDecoder("big5");
const BIG5 = "BIG5";

const GB18030_DECODER = new _textEncoding.TextDecoder("gb18030");
const GB18030 = "GB18030";

//-----------------------------
//        TOOL METHODS
//-----------------------------
function parseHeader(header_text) {
  const doc = new _xmldom.DOMParser().parseFromString(header_text, "text/xml");
  const header_attr = {};
  let elem = doc.getElementsByTagName("Dictionary")[0];
  if (!elem) {
    elem = doc.getElementsByTagName("Library_Data")[0]; // eslint_disable_prefer_destructing
  }
  for (let i = 0, item; i < elem.attributes.length; i++) {
    item = elem.attributes[i];
    header_attr[item.nodeName] = item.nodeValue;
  }
  return header_attr;
  // below is regexp method, but not support new line regexp
  // const re = /(\w+)="(.*?)"/g;
  // let m;
  // do {
  //   m = re.exec(header_text);
  //   if (m) {
  //     console.log(`${m[1]} = "${m[2]}"`);
  //   }
  // } while (m);
}

/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 *
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
function _appendBuffer(buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}

function _numEqual(num1, num2) {
  let a;
  let b;
  if (!_long2.default.isLong(num1)) {
    a = new _long2.default(num1, 0);
  } else {
    a = num1;
  }
  if (!_long2.default.isLong(num2)) {
    b = new _long2.default(num2, 0);
  } else {
    b = num2;
  }
  return a.eq(b);
}

class Mdict {
  constructor(dictPath) {
    this.dictPath = dictPath;
    this.ext = _common2.default.getExtension(dictPath, "mdx");
    this.parser = new _Parser2.default(this.dictPath, this.ext);
  }
  build() {
    return new Promise((_resolve, _reject) => {
      this.parser.parse().then(dict => {
        this.trie = _doublearray2.default.builder().build(dict.keyList.map(keyword => ({ k: this._adapt(keyword.key), v: keyword.offset })));
        this.recordTable = dict.recordBlockTable;
        this.buffer = dict.buffer;
        this.attributes = dict.headerAttributes;
        _resolve(this);
      }).catch(err => _reject(err));
    });
  }

  prefix(word) {
    if (!this.trie) {
      throw new Error("preSearch require use in promise after build");
    }
    return this.trie.commonPrefixSearch(word);
  }

  contain(word) {
    if (!this.trie) {
      throw new Error("contain require use in Promise after build");
    }
    return this.trie.contain(word);
  }

  lookup(word) {
    if (!this.trie) {
      throw new Error("contain require use in Promise after build");
    }
    if (!this.contain(word)) {
      return "NOT_FOUND";
    }
    const keyWordIndexOffset = this.trie.lookup(word);
    // TODO get more cooll readDefination method
    return this.parser.scanner.readDifination(this.buffer, this.recordTable.find(keyWordIndexOffset), keyWordIndexOffset);
  }

  attr() {
    if (!this.attributes) {
      throw new Error("attributes require use in Promise after build");
    }
    return this.attributes;
  }

  _adapt(key) {
    return this.parser.scanner._adaptKey(key);
  }
}
exports.default = Mdict;