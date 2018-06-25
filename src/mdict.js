import struct from "python-struct";
import readChunk from "read-chunk";
import assert from "assert";
import dart from "doublearray";
import BufferList from "bl";
import pako from "pako";
import Long from "long";
import lzo from "lzo";
import bufferToArrayBuffer from "buffer-to-arraybuffer";

import { TextDecoder } from "text-encoding";
import { DOMParser } from "xmldom";

import Parser from "./Parser";
import common from "./common";
import lzo1x from "./lzo-wrapper";
import ripemd128 from "./ripemd128";

const UTF_16LE_DECODER = new TextDecoder("utf-16le");
const UTF16 = "UTF-16";

const UTF_8_DECODER = new TextDecoder("utf-8");
const UTF8 = "UTF-8";

const BIG5_DECODER = new TextDecoder("big5");
const BIG5 = "BIG5";

const GB18030_DECODER = new TextDecoder("gb18030");
const GB18030 = "GB18030";


//-----------------------------
//        TOOL METHODS
//-----------------------------
function parseHeader(header_text) {
  const doc = new DOMParser().parseFromString(header_text, "text/xml");
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
  if (!Long.isLong(num1)) {
    a = new Long(num1, 0);
  } else {
    a = num1;
  }
  if (!Long.isLong(num2)) {
    b = new Long(num2, 0);
  } else {
    b = num2;
  }
  return a.eq(b);
}

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
