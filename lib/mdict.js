"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _doublearray = require("doublearray");

var _doublearray2 = _interopRequireDefault(_doublearray);

var _Parser = require("./Parser");

var _Parser2 = _interopRequireDefault(_Parser);

var _common = require("./common");

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

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