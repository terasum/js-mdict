import dart from "doublearray";
import Parser from "./Parser";
import common from "./common";

class Mdict {
  constructor(dictPath) {
    this.dictPath = dictPath;
    this.ext = common.getExtension(dictPath, "mdx");
    this.parser = new Parser(this.dictPath, this.ext);
  }
  build() {
    return new Promise((_resolve, _reject) => {
      this.parser.parse().then((dict) => {
        this.trie = dart.builder()
          .build(dict.keyList
            .map(keyword => ({ k: this._adapt(keyword.key), v: keyword.offset })));
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
    return this.parser
      .scanner.readDifination(this.buffer, this.recordTable
        .find(keyWordIndexOffset), keyWordIndexOffset);
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

export default Mdict;

