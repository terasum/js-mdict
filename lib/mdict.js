"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
var UTF16 = "UTF-16";

var UTF_8_DECODER = new _textEncoding.TextDecoder("utf-8");
var UTF8 = "UTF-8";

var BIG5_DECODER = new _textEncoding.TextDecoder("big5");
var BIG5 = "BIG5";

var GB18030_DECODER = new _textEncoding.TextDecoder("gb18030");
var GB18030 = "GB18030";

//-----------------------------
//        TOOL METHODS
//-----------------------------
function parseHeader(header_text) {
  var doc = new _xmldom.DOMParser().parseFromString(header_text, "text/xml");
  var header_attr = {};
  var elem = doc.getElementsByTagName("Dictionary")[0];
  if (!elem) {
    elem = doc.getElementsByTagName("Library_Data")[0]; // eslint_disable_prefer_destructing
  }
  for (var i = 0, item; i < elem.attributes.length; i++) {
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
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}

function _numEqual(num1, num2) {
  var a = void 0;
  var b = void 0;
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

var Mdict = function () {
  function Mdict(dictPath) {
    _classCallCheck(this, Mdict);

    this.dictPath = dictPath;
    this.ext = _common2.default.getExtension(dictPath, "mdx");
    this.parser = new _Parser2.default(this.dictPath, this.ext);
  }

  _createClass(Mdict, [{
    key: "build",
    value: function build() {
      var _this = this;

      return new Promise(function (_resolve, _reject) {
        _this.parser.parse().then(function (dict) {
          _this.trie = _doublearray2.default.builder().build(dict.keyList.map(function (keyword) {
            return { k: _this._adapt(keyword.key), v: keyword.offset };
          }));
          _this.recordTable = dict.recordBlockTable;
          _this.buffer = dict.buffer;
          _this.attributes = dict.headerAttributes;
          _resolve(_this);
        }).catch(function (err) {
          return _reject(err);
        });
      });
    }
  }, {
    key: "prefix",
    value: function prefix(word) {
      if (!this.trie) {
        throw new Error("preSearch require use in promise after build");
      }
      return this.trie.commonPrefixSearch(word);
    }
  }, {
    key: "contain",
    value: function contain(word) {
      if (!this.trie) {
        throw new Error("contain require use in Promise after build");
      }
      return this.trie.contain(word);
    }
  }, {
    key: "lookup",
    value: function lookup(word) {
      if (!this.trie) {
        throw new Error("contain require use in Promise after build");
      }
      if (!this.contain(word)) {
        return "NOT_FOUND";
      }
      var keyWordIndexOffset = this.trie.lookup(word);
      // TODO get more cooll readDefination method
      return this.parser.scanner.readDifination(this.buffer, this.recordTable.find(keyWordIndexOffset), keyWordIndexOffset);
    }
  }, {
    key: "attr",
    value: function attr() {
      if (!this.attributes) {
        throw new Error("attributes require use in Promise after build");
      }
      return this.attributes;
    }
  }, {
    key: "_adapt",
    value: function _adapt(key) {
      return this.parser.scanner._adaptKey(key);
    }
  }]);

  return Mdict;
}();

exports.default = Mdict;