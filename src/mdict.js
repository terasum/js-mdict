/// <reference path="../typings/mdict.d.ts" />

import { lemmatizer } from 'lemmatizer';
import dictionary from 'dictionary-en-us';
import nspell from 'nspell';
import dart from 'doublearray';

import MdictBase from './mdict-base';
import common from './common';

class Mdict extends MdictBase {
  constructor(fname, searchOptions = {}) {
    const passcode = searchOptions.passcode || undefined;
    super(fname, passcode);
    this.searchOptions = {};
    searchOptions = searchOptions || {};
    this.searchOptions.passcode = searchOptions.passcode || undefined;
    this.searchOptions.keyCaseSensitive = searchOptions.keyCaseSensitive;
    this.searchOptions.stripKey = searchOptions.stripKey;
  }

  _stripKey() {
    const stripKey =
      this.searchOptions.stripKey || common.isTrue(this.header.StripKey);
    const regexp = common.REGEXP_STRIPKEY[this.ext];

    return stripKey
      ? function _s(key) {
        return key.replace(regexp, "$1");
      }
      : function _s(key) {
        return key;
      };
  }

  lookup(word) {
    const record = this._lookupKID(word);

    // if not found the key block, return undefined
    if (record === undefined) {
      return {
        keyText: word,
        definition: null,
      };
    }

    const i = record.idx;
    const list = record.list;

    const rid = this._reduceRecordBlock(list[i].recordStartOffset);
    const nextStart =
      i + 1 >= list.length
        ? this._recordBlockStartOffset +
        this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
          .decompAccumulator +
        this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
          .decompSize
        : list[i + 1].recordStartOffset;
    const data = this._decodeRecordBlockByRBID(
      rid,
      list[i].keyText,
      list[i].recordStartOffset,
      nextStart,
    );
    return data;
  }

  _isKeyCaseSensitive() {
    return this.searchOptions.keyCaseSensitive ||
      common.isTrue(this.header.KeyCaseSensitive);
  }

  _lookupKID(word) {
    const lookupInternal = (compareFn) => {
      const sfunc = this._stripKey();
      const kbid = this._reduceWordKeyBlock(word, sfunc, compareFn);
      // not found
      if (kbid < 0) {
        return undefined;
      }
      const list = this._decodeKeyBlockByKBID(kbid);
      const i = this._binarySearh(list, word, sfunc, compareFn);
      if (i === undefined) {
        return undefined;
      }
      return { idx: i, list };
    };

    let record;
    if (this._isKeyCaseSensitive()) {
      record = lookupInternal(common.normalUpperCaseWordCompare);
    } else {
      record = lookupInternal(common.normalUpperCaseWordCompare);
      if (record === undefined) {
        record = lookupInternal(common.wordCompare);
      }
    }
    return record;
  }

  _binarySearh(list, word, _s, compareFn) {
    if (!_s || _s == undefined) {
      // eslint-disable-next-line
      _s = this._stripKey();
    }
    let left = 0;
    let right = list.length - 1;
    let mid = 0;
    while (left <= right) {
      mid = left + ((right - left) >> 1);
      // if case sensitive, the uppercase word is smaller than lowercase word
      // for example: `Holanda` is smaller than `abacaxi`
      // so when comparing with the words, we should use the dictionary order,
      // however, if we change the word to lowercase, the binary search algorithm will be confused
      // so, we use the enhanced compare function `common.wordCompare`
      const compareResult = compareFn(_s(word), _s(list[mid].keyText));
      // console.log(`@#@# wordCompare ${_s(word)} ${_s(list[mid].keyText)} ${compareResult} l: ${left} r: ${right} mid: ${mid} ${list[mid].keyText}`)
      if (compareResult > 0) {
        left = mid + 1;
      } else if (compareResult == 0) {
        return mid;
      } else {
        right = mid - 1;
      }
    }
    return undefined;
  }

  _findList(word) {
    const findListInternal = (compareFn) => {
      const sfunc = this._stripKey();
      const kbid = this._reduceWordKeyBlock(word, sfunc, compareFn);
      // not found
      if (kbid < 0) {
        return undefined;
      }
      return {sfunc, kbid, list:this._decodeKeyBlockByKBID(kbid)};
    };

    let list;
    if (this._isKeyCaseSensitive()) {
      list = findListInternal(common.normalUpperCaseWordCompare);
    } else {
      list = findListInternal(common.normalUpperCaseWordCompare);
      if (list === undefined) {
        list = findListInternal(common.wordCompare);
      }
    }
    return list;
  }

  /**
   * get word prefix words
   * @param {string} phrase the word which needs to find prefix
   */
  prefix(phrase) {
    const list = this._findList(phrase).list;
    const trie = dart.builder().build(
      list.map((keyword) => ({
        k: keyword.keyText,
        v: keyword.recordStartOffset,
      }))
    );
    return trie
      .commonPrefixSearch(phrase)
      .map((item) => ({ key: item.k, rofset: item.v }));
  }

  /**
   * get words associated
   * @param {string} phrase the word which needs to be associated
   */
  associate(phrase) {
    const record = this._findList(phrase);
    const sfunc = record.sfunc;
    let kbid = record.kbid;
    let list = record.list;
    const matched = list.filter((item) =>
      sfunc(item.keyText).startsWith(sfunc(phrase))
    );
    if (!matched.length) return matched;
    // in case there are matched items in next key block
    while (
      matched[matched.length - 1].keyText === list[list.length - 1].keyText &&
      kbid < this.keyBlockInfoList.length
    ) {
      kbid++;
      list = this._decodeKeyBlockByKBID(kbid);
      matched.concat(
        list.filter((item) => sfunc(item.keyText).startsWith(sfunc(phrase)))
      );
    }
    // to meet the typings
    matched.map((item) => {
      item.rofset = item.recordStartOffset;
    });

    return matched;
  }

  /**
   * fuzzy_search
   * find latest `fuzzy_size` words, and filter by lavenshtein_distance
   * `fuzzy_size` means find the word's `fuzzy_size` number nabors
   * and filter with `ed_gap`
   *
   * for example, fuzzy_size('hello', 3, 1)
   * first find hello's nabor:
   * hell   --> edit distance: 1
   * hallo  --> edit distance: 1
   * hall   --> edit distance: 2
   * the result is:
   * [hell, hallo]
   *
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
    fwords = fwords.concat(
      this.prefix(word).map((kv) => ({
        key: kv.key,
        idx: kv.rofset,
        ed: common.levenshtein_distance(word, kv.k),
      }))
    );
    fuzzy_size =
      fuzzy_size - fwords.length < 0 ? 0 : fuzzy_size - fwords.length;
    fwords.map((fw) => {
      const { idx, list } = this._lookupKID(fw.key);
      return this._find_nabor(idx, Math.ceil(fuzzy_size / fwords.length), list)
        .filter(
          (item) => common.levenshtein_distance(item.keyText, word) <= ed_gap
        )
        .map((kitem) =>
          fuzzy_words.push({
            key: kitem.keyText,
            rofset: kitem.recordStartOffset,
            ed: common.levenshtein_distance(word, kitem.keyText),
          })
        );
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
    return this._loadSuggDict().then(
      (dict) => {
        const spell = nspell(dict);
        return spell.suggest(phrase);
      },
      (err) => {
        throw err;
      }
    );
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
    const nextStart =
      idx + 1 >= list.length
        ? this._recordBlockStartOffset +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompAccumulator +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompSize
        : list[idx + 1].recordStartOffset;
    const data = this._decodeRecordBlockByRBID(
      rid,
      list[idx].keyText,
      list[idx].recordStartOffset,
      nextStart
    );
    return data;
  }
}

export default Mdict;
