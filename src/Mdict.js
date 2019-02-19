/// <reference path="../typings/Mdict.d.ts" />

import { lemmatizer } from "lemmatizer";
import dictionary from "dictionary-en-us";
import nspell from "nspell";
import dart from "doublearray";


import MdictBase from "./MdictBase";
import common from "./common";

/**
 * Test if a value of dictionary attribute is true or not.
 * ref: https://github.com/fengdh/mdict-js/blob/efc3fa368edd6e57de229375e2b73bbfe189e6ee/mdict-parser.js:235
 */
function isTrue(v) {
  v = (v).toLowerCase();
  return v === "yes" || v === "true";
}
class Mdict extends MdictBase {
//   constructor(fname, passcode) {
//   }
  _stripKey() {
    const regexp = common.REGEXP_STRIPKEY[this.ext];
    if (isTrue(this.header.KeyCaseSensitive)) {
      return isTrue(this.header.StripKey)
        ? function _s(key) { return key.replace(regexp, "$1"); }
        : function _s(key) { return key; };
    }
    return isTrue(this.header.StripKey || (this._version >= 2.0 ? "" : "yes"))
      ? function _s(key) { return key.toLowerCase().replace(regexp, "$1"); }
      : function _s(key) { return key.toLowerCase(); };
  }


  lookup(word) {
    const sfunc = this._stripKey();
    const kbid = this._reduceWordKeyBlock(word, sfunc);
    const list = this._decodeKeyBlockByKBID(kbid);
    const i = this._binarySearh(list, word, sfunc);
    const rid = this._reduceRecordBlock(list[i].recordStartOffset);
    const nextStart = i + 1 >= list.length
      ? this._recordBlockStartOffset +
      this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompAccumulator +
      this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompSize
      : list[i + 1].recordStartOffset;
    const data = this._decodeRecordBlockByRBID(
      rid,
      list[i].keyText,
      list[i].recordStartOffset,
      nextStart,
    );
    return data;
  }

  _lookupKID(word) {
    const sfunc = this._stripKey();
    const kbid = this._reduceWordKeyBlock(word, sfunc);
    const list = this._decodeKeyBlockByKBID(kbid);
    const i = this._binarySearh(list, word, sfunc);
    return { idx: i, list };
  }

  _binarySearh(list, word, _s) {
    if (!_s || _s == undefined) {
      // eslint-disable-next-line
      _s = this._stripKey();
    }
    let left = 0;
    let right = list.length;
    let mid = 0;
    while (left < right) {
      mid = left + ((right - left) >> 1);
      if (_s(word) > _s(list[mid].keyText)) {
        left = mid + 1;
      } else if (_s(word) == _s(list[mid].keyText)) {
        return mid;
      } else {
        right = mid - 1;
      }
    }
    return left;
  }

  /**
   * get word prefix words
   * @param {string} phrase the word which needs to find prefix
   */
  prefix(phrase) {
    const sfunc = this._stripKey();
    const kbid = this._reduceWordKeyBlock(phrase, sfunc);
    const list = this._decodeKeyBlockByKBID(kbid);
    const trie = dart.builder()
      .build(list
        .map(keyword =>
          ({ k: keyword.keyText, v: keyword.recordStartOffset })));
    return trie.commonPrefixSearch(phrase).map(item => ({ key: item.k, rofset: item.v }));
  }

  /**
   * fuzzy_search
   * find latest `fuzzy_size` words, and filter by lavenshtein_distance
   * return wordlist struct:
   * [
   * {
   * ed: Number  // word edit distance
   * idx: Number // word dict idx
   * key: string // word key string
   * }
   * ]
   */

  fuzzy_search(word, fuzzy_size, ed_gap) {
    let fwords = [];
    const fuzzy_words = [];
    fwords = fwords.concat(this.prefix(word)
      .map(kv => ({
        key: kv.key,
        idx: kv.rofset,
        ed: common.levenshtein_distance(word, kv.k),
      })));
    fuzzy_size = fuzzy_size - fwords.length < 0 ? 0 : fuzzy_size - fwords.length;
    fwords.map((fw) => {
      const { idx, list } = this._lookupKID(fw.key);
      return this._find_nabor(idx, Math.ceil(fuzzy_size / fwords.length), list)
        .filter(item => common.levenshtein_distance(item.keyText, word) <= ed_gap)
        .map(kitem => fuzzy_words.push({
          key: kitem.keyText,
          rofset: kitem.recordStartOffset,
          ed: common.levenshtein_distance(word, kitem.keyText),
        }));
    });
    return fuzzy_words;
  }


  /**
   * return word's lemmatizer
   * @param {string} phrase word phrase
   */
  lemmer(phrase) {
    return lemmatizer(phrase);
  }

  _loadSuggDict() {
    return new Promise((resolve, reject) => {
      function onDictLoad(err, dict) {
        if (err) {
          reject(err);
        }
        resolve(dict);
      }
      dictionary(onDictLoad);
    });
  }

  suggest(phrase) {
    return this._loadSuggDict().then((dict) => {
      const spell = nspell(dict);
      return spell.suggest(phrase);
    }, (err) => {
      throw err;
    });
  }

  _find_nabor(idx, fuzsize, list) {
    const imax = list.length;
    const istart = idx - fuzsize < 0 ? 0 : idx - fuzsize;
    const iend = idx + fuzsize > imax ? imax : idx + fuzsize;
    return list.slice(istart, iend);
  }


  /**
   * parse the definition by word and ofset
   * @param {string} word the target word
   * @param {number} rstartofset the record start offset (fuzzy_start rofset)
   */
  parse_defination(word, rstartofset) {
    const rid = this._reduceRecordBlock(rstartofset);
    const { idx, list } = this._lookupKID(word);
    const nextStart = idx + 1 >= list.length
      ? this._recordBlockStartOffset +
      this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompAccumulator +
      this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompSize
      : list[idx + 1].recordStartOffset;
    const data = this._decodeRecordBlockByRBID(
      rid,
      list[idx].keyText,
      list[idx].recordStartOffset,
      nextStart,
    );
    return data;
  }
}

export default Mdict;
