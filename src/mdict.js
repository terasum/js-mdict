/// <reference path="../typings/mdict.d.ts" />

import { lemmatizer } from "lemmatizer";
import dictionary from "dictionary-en-us";
import nspell from "nspell";
import dart from "doublearray";

import MdictBase from "./mdict-base";
import common from "./common";

class Mdict extends MdictBase {
  constructor(fname, options) {
    options = options || {};
    options = {
      passcode: options.passcode ?? "",
      debug: options.debug ?? false,
      resort: options.resort ?? true,
      isStripKey: options.isStripKey ?? true,
      isCaseSensitive: options.isCaseSensitive ?? true,
    };

    const passcode = options.passcode || undefined;
    super(fname, passcode, options);
    this.options = options;
  }

  _binarySearchByResort(word) {
    const _strip = this._stripKeyOrIngoreCase();

    // binary search from keyList
    let start = 0;
    let mid = 0;
    let end = this.keyList.length;
    // target word
    word = _strip(word);

    let keyRecord;
    while (start <= end) {
      mid = start + ((end - start) >> 1);
      let keyText = _strip(this.keyList[mid].keyText);

      if (keyText > word) {
        end = mid - 1;
      } else if (keyText < word) {
        start = mid + 1;
      } else {
        keyRecord = this.keyList[mid];
        break;
      }
    }

    return keyRecord;
  }

  _prefixBinarySearchByResort(word) {
    const _strip = this._stripKeyOrIngoreCase();
    let end = this.keyList.length;
    word = _strip(word);
    for (let i = 0; i < end; i++) {
      let keyText = _strip(this.keyList[i].keyText);
      if (keyText.startsWith(word)) {
        return i;
      }
    }
    return -1;
  }

  _binarySearchByResort2(word) {
    const _strip = this._stripKeyOrIngoreCase();
    word = _strip(word);
    for (let i = 0; i < this.keyList.length; i++) {
      let keyText = _strip(this.keyList[i].keyText);
      if (word == keyText) {
        return this.keyList[i];
      }
    }
    return undefined;
  }

  _lookupByResort(word) {
    const keyRecord = this._binarySearchByResort2(word);
    // if not found the key block, return undefined
    if (keyRecord === undefined) {
      return {
        keyText: word,
        definition: null,
      };
    }

    const i = keyRecord.original_idx;
    const rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
    const nextStart =
      i + 1 >= this.keyList.length
        ? this._recordBlockStartOffset +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompAccumulator +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompSize
        : this.keyList[this.keyListRemap[i + 1]].recordStartOffset;
    const data = this._decodeRecordBlockByRBID(
      rid,
      keyRecord.keyText,
      keyRecord.recordStartOffset,
      nextStart
    );
    return data;
  }

  /**
   *
   * @param {string} word the target word
   * @returns definition
   */
  lookup(word) {
    if (this.ext == "mdx" && this.options.resort) {
      return this._lookupByResort(word);
    } else {
      throw new Error(
        "depreciated, use `locate` method to find out mdd resource"
      );
    }
  }

  /**
   * locate mdd resource binary data
   * @param {string} resourceKey resource key
   * @returns resource binary data
   */
  locate(resourceKey) {
    const keyRecord = this._binarySearchByResort2(resourceKey);
    // if not found the key block, return undefined
    if (keyRecord === undefined) {
      return {
        keyText: word,
        definition: null,
      };
    }

    const i = keyRecord.original_idx;
    const rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
    const nextStart =
      i + 1 >= this.keyList.length
        ? this._recordBlockStartOffset +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompAccumulator +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompSize
        : this.keyList[this.keyListRemap[i + 1]].recordStartOffset;
    const data = this._decodeRecordBlockByRBID(
      rid,
      keyRecord.keyText,
      keyRecord.recordStartOffset,
      nextStart
    );
    return data;
  }

  _lookupRecordBlockWordList(word) {
    const lookupInternal = (compareFn) => {
      const sfunc = this._stripKeyOrIngoreCase();
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
      return list;
    };

    let list;
    if (this._isKeyCaseSensitive()) {
      list = lookupInternal(common.caseSensitiveCompare);
    } else {
      list = lookupInternal(common.caseSensitiveCompare);
      if (list === undefined) {
        list = lookupInternal(common.caseUnSensitiveCompare);
      }
    }
    return list;
  }

  _locateResource(key) {
    const sfunc = this._stripKeyOrIngoreCase();

    let compareFn;
    if (this._isKeyCaseSensitive()) {
      compareFn = common.caseSensitiveCompare;
    } else {
      compareFn = common.caseUnsensitiveCompare;
    }

    const kbid = this._reduceWordKeyBlock(key, sfunc, compareFn);
    // not found
    if (kbid < 0) {
      return undefined;
    }

    const list = this._decodeKeyBlockByKBID(kbid);

    const i = this._binarySearh(list, key, sfunc, compareFn);
    if (i === undefined) {
      return undefined;
    }

    return { idx: i, list };
  }

  _binarySearh(list, word, _s, compareFn) {
    if (!_s || _s == undefined) {
      _s = this._stripKeyOrIngoreCase();
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
      const sfunc = this._stripKeyOrIngoreCase();
      const kbid = this._reduceWordKeyBlock(word, sfunc, compareFn);
      // not found
      if (kbid < 0) {
        return undefined;
      }
      return { sfunc, kbid, list: this._decodeKeyBlockByKBID(kbid) };
    };

    let list;
    if (this._isKeyCaseSensitive()) {
      list = findListInternal(common.caseSensitiveCompare);
    } else {
      list = findListInternal(common.caseSensitiveCompare);
      if (list === undefined) {
        list = findListInternal(common.caseUnsensitiveCompare);
      }
    }
    return list;
  }

  _locate_prefix_list(phrase, max_len = 100, max_missed = 100) {
    const record = this._prefixBinarySearchByResort(phrase);
    if (record == -1) {
      return [];
    }
    const fn = this._stripKeyOrIngoreCase();

    let list = [];
    let count = 0;
    let missed = 0;
    for (let i = record; i < this.keyList.length; i++) {
      if (this.keyList[i].keyText.startsWith(fn(phrase))) {
        list.push(this.keyList[i]);
        count++;
      } else {
        missed++;
      }
      if (count > max_len) {
        break;
      }
      if (missed > max_missed) {
        break;
      }
    }

    return list;
  }

  /**
   * get word prefix words
   * @param {string} phrase the word which needs to find prefix
   */
  prefix(phrase) {
    const list = this._locate_prefix_list(phrase);
    if (!list) {
      return [];
    }
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
    const matched = this._locate_prefix_list(phrase, 100);
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
    const fuzzy_words = [];
    let count = 0;
    const fn = this._stripKeyOrIngoreCase();
    for (let i = 0; i < this.keyList.length; i++) {
      let item = this.keyList[i];
      let key = fn(item.keyText);
      let ed = common.levenshtein_distance(key, fn(word));
      if (ed <= ed_gap) {
        count++;
        if (count > fuzzy_size) {
          break;
        }
        fuzzy_words.push({
          ...item,
          key: item.keyText,
          idx: item.recordStartOffset,
          ed: ed,
        });
      }
    }

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
    const { idx, list } = this._locateResource(word);
    const nextStart =
      idx + 1 >= list.length
        ? this._recordBlockStartOffset +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompAccumulator +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompSize
        : list[idx + 1].recordStartOffset;
    let startoffset = list[idx].recordStartOffset;
    if (rstartofset != startoffset) {
      // if args.rstartofset != list[idx].recordStartOffset
      // use args.rstartofset
      startoffset = rstartofset;
    }
    const data = this._decodeRecordBlockByRBID(
      rid,
      list[idx].keyText,
      startoffset,
      nextStart
    );
    return data;
  }

  parse_def_record(keyRecord) {
    const rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
    const data = this._decodeRecordBlockByRBID(
      rid,
      keyRecord.keyText,
      keyRecord.recordStartOffset,
      keyRecord.nextRecordStartOffset
    );
    return data;
  }

  rangeKeyWords() {
    return this._decodeKeyBlock();
  }
}

export default Mdict;
