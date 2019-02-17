import pako from "pako";

import MdictBase from "./MdictBase";
import common from "./common";

class Mdict extends MdictBase {
//   constructor(fname, passcode) {
//       super(fname, passcode);

//     // console.log(this.key_data
//     // .map(keyword => ({ k: keyword.key, v: keyword })));
//     // TODO: out of memory
//     // this.bktree = new BKTree(this.key_data.length);
//     // this.trie = dart.builder()
//     //   .build(this.key_data
//     //     .map(keyword =>
//     //       // TODO: bktree here will out of memory
//     //       // this.bktree.add(keyword.key);
//     //       // cousole.log(keyword.key)
//     //       ({ k: keyword.key, v: keyword.idx })));
//     // const d5 = new Date().getTime();
//     // console.log(`dart build used: ${(d5 - d4) / 1000.0} s`);
//     // console.log(key_data[0]);
//   }

  lookup(word) {
    function stripFunc(phrase) {
      return phrase;
    }
    const kbid = this._reduceWordKeyBlock(word, stripFunc);
    const list = this._decodeKeyBlockByKBID(kbid);
    const i = this._binarySearh(list, word, stripFunc);
    const rid = this._reduceRecordBlock(list[i].recordStartOffset);
    const data = this._decodeRecordBlockByRBID(
      rid,
      list[i].keyText,
      list[i].recordStartOffset,
      list[i + 1].recordStartOffset,
    );
    return data;
  }
  _binarySearh(list, word, _s) {
    if (!_s || _s == undefined) {
      // eslint-disable-next-line
      _s = (word) => { return word; };
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
      console.log("not found!");
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
