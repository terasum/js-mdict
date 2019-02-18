import pako from "pako";
import { lemmatizer } from "lemmatizer";
import dictionary from "dictionary-en-us";
import nspell from "nspell";


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
    const fuzzy_words = [];
    this.prefix(word)
      .map(item => this._find_nabor(item.v, fuzzy_size)
        .map((w) => {
          const ed = common.levenshtein_distance(word, w.key);
          if (ed < (ed_gap || 5)) {
            fuzzy_words.push({
              ed,
              idx: w.idx,
              key: w.key,
            });
          }
          return null;
        }));
    return fuzzy_words;
  }

  _find_nabor(sim_idx, fuzzy_size) {
    const set_size = this.key_data.length;
    const sim_idx_start = sim_idx - fuzzy_size < 0
      ? 0
      : sim_idx - fuzzy_size;
    const sim_idx_end = sim_idx + fuzzy_size > set_size
      ? set_size
      : sim_idx + fuzzy_size;

    const nabor_words = [];

    for (let i = sim_idx_start; i < sim_idx_end; i++) {
      nabor_words.push({
        idx: i,
        key: this.key_data[i].key,
      });
    }
    return nabor_words;
  }

  _bsearch_sim_idx(word) {
    let lo = 0;
    let hi = this.key_data.length - 1;
    let mid = 0;
    // find last equal or less than key word
    while (lo <= hi) {
      mid = lo + ((hi - lo) >> 1);
      if (this.key_data[mid].key.localeCompare(word) > 0 /* word > key */) { hi = mid - 1; } else {
        lo = mid + 1;
      }
    }
    return hi;
  }

  bsearch(word) {
    let lo = 0;
    let hi = this.key_data.length - 1;
    let mid = 0;
    while (lo <= hi) {
      mid = lo + ((hi - lo) >> 1);
      if (this.key_data[mid].key.localeCompare(word) > 0 /* word > key */) { hi = mid - 1; }
      if (this.key_data[mid].key.localeCompare(word) < 0 /* word < key */) { lo = mid + 1; }
      if (this.key_data[mid].key.localeCompare(word) == 0) { break; }
    }
    if (lo > hi) {
      // not found
      return undefined;
    }

    return this.parse_defination(mid);
  }
  parse_defination(idx) {
    const word_info = this.key_data[idx];
    if (!word_info || word_info == undefined) {
      return "NOTFOUND";
    }
    let defbuf = this._readBuffer(word_info.record_comp_start, word_info.record_compressed_size);
    if (word_info.record_comp_type == "zlib") {
      defbuf = pako.inflate(defbuf.slice(8, defbuf.length));
    } else {
      return "NOT_SUPPORT_COMPRESS_TYPE";
    }
    if (this.ext == "mdx") {
      return this._decoder
        .decode(defbuf.slice(word_info.relateive_record_start, word_info.relative_record_end));
    }
    return defbuf.slice(word_info.relateive_record_start, word_info.relative_record_end);
  }
}

export default Mdict;
