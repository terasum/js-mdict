"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pako = require("pako");

var _pako2 = _interopRequireDefault(_pako);

var _lemmatizer = require("lemmatizer");

var _dictionaryEnUs = require("dictionary-en-us");

var _dictionaryEnUs2 = _interopRequireDefault(_dictionaryEnUs);

var _nspell = require("nspell");

var _nspell2 = _interopRequireDefault(_nspell);

var _MdictBase2 = require("./MdictBase");

var _MdictBase3 = _interopRequireDefault(_MdictBase2);

var _common = require("./common");

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * Test if a value of dictionary attribute is true or not.
 * ref: https://github.com/fengdh/mdict-js/blob/efc3fa368edd6e57de229375e2b73bbfe189e6ee/mdict-parser.js:235
 */
function isTrue(v) {
  v = v.toLowerCase();
  return v === "yes" || v === "true";
}

var Mdict = function (_MdictBase) {
  _inherits(Mdict, _MdictBase);

  function Mdict() {
    _classCallCheck(this, Mdict);

    return _possibleConstructorReturn(this, (Mdict.__proto__ || Object.getPrototypeOf(Mdict)).apply(this, arguments));
  }

  _createClass(Mdict, [{
    key: "_stripKey",

    //   constructor(fname, passcode) {
    //   }
    value: function _stripKey() {
      var regexp = _common2.default.REGEXP_STRIPKEY[this.ext];
      if (isTrue(this.header.KeyCaseSensitive)) {
        return isTrue(this.header.StripKey) ? function _s(key) {
          return key.replace(regexp, "$1");
        } : function _s(key) {
          return key;
        };
      }
      return isTrue(this.header.StripKey || (this._version >= 2.0 ? "" : "yes")) ? function _s(key) {
        return key.toLowerCase().replace(regexp, "$1");
      } : function _s(key) {
        return key.toLowerCase();
      };
    }
  }, {
    key: "lookup",
    value: function lookup(word) {
      var sfunc = this._stripKey();
      var kbid = this._reduceWordKeyBlock(word, sfunc);
      var list = this._decodeKeyBlockByKBID(kbid);
      var i = this._binarySearh(list, word, sfunc);
      var rid = this._reduceRecordBlock(list[i].recordStartOffset);
      var nextStart = i + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompSize : list[i + 1].recordStartOffset;
      var data = this._decodeRecordBlockByRBID(rid, list[i].keyText, list[i].recordStartOffset, nextStart);
      return data;
    }
  }, {
    key: "_binarySearh",
    value: function _binarySearh(list, word, _s) {
      if (!_s || _s == undefined) {
        // eslint-disable-next-line
        _s = this._stripKey();
      }
      var left = 0;
      var right = list.length;
      var mid = 0;
      while (left < right) {
        mid = left + (right - left >> 1);
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

  }, {
    key: "lemmer",
    value: function lemmer(phrase) {
      return (0, _lemmatizer.lemmatizer)(phrase);
    }
  }, {
    key: "_loadDict",
    value: function _loadDict() {
      return new Promise(function (resolve, reject) {
        function onDictLoad(err, dict) {
          if (err) {
            reject(err);
          }
          resolve(dict);
        }
        (0, _dictionaryEnUs2.default)(onDictLoad);
      });
    }
  }, {
    key: "suggest",
    value: function suggest(phrase) {
      return this._loadDict().then(function (dict) {
        var spell = (0, _nspell2.default)(dict);
        return spell.suggest(phrase);
      }, function (err) {
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

  }, {
    key: "fuzzy_search",
    value: function fuzzy_search(word, fuzzy_size, ed_gap) {
      var _this2 = this;

      var fuzzy_words = [];
      this.prefix(word).map(function (item) {
        return _this2._find_nabor(item.v, fuzzy_size).map(function (w) {
          var ed = _common2.default.levenshtein_distance(word, w.key);
          if (ed < (ed_gap || 5)) {
            fuzzy_words.push({
              ed: ed,
              idx: w.idx,
              key: w.key
            });
          }
          return null;
        });
      });
      return fuzzy_words;
    }
  }, {
    key: "_find_nabor",
    value: function _find_nabor(sim_idx, fuzzy_size) {
      var set_size = this.key_data.length;
      var sim_idx_start = sim_idx - fuzzy_size < 0 ? 0 : sim_idx - fuzzy_size;
      var sim_idx_end = sim_idx + fuzzy_size > set_size ? set_size : sim_idx + fuzzy_size;

      var nabor_words = [];

      for (var i = sim_idx_start; i < sim_idx_end; i++) {
        nabor_words.push({
          idx: i,
          key: this.key_data[i].key
        });
      }
      return nabor_words;
    }
  }, {
    key: "_bsearch_sim_idx",
    value: function _bsearch_sim_idx(word) {
      var lo = 0;
      var hi = this.key_data.length - 1;
      var mid = 0;
      // find last equal or less than key word
      while (lo <= hi) {
        mid = lo + (hi - lo >> 1);
        if (this.key_data[mid].key.localeCompare(word) > 0 /* word > key */) {
            hi = mid - 1;
          } else {
          lo = mid + 1;
        }
      }
      return hi;
    }
  }, {
    key: "bsearch",
    value: function bsearch(word) {
      var lo = 0;
      var hi = this.key_data.length - 1;
      var mid = 0;
      while (lo <= hi) {
        mid = lo + (hi - lo >> 1);
        if (this.key_data[mid].key.localeCompare(word) > 0 /* word > key */) {
            hi = mid - 1;
          }
        if (this.key_data[mid].key.localeCompare(word) < 0 /* word < key */) {
            lo = mid + 1;
          }
        if (this.key_data[mid].key.localeCompare(word) == 0) {
          break;
        }
      }
      if (lo > hi) {
        // not found
        console.log("not found!");
        return undefined;
      }

      return this.parse_defination(mid);
    }
  }, {
    key: "parse_defination",
    value: function parse_defination(idx) {
      var word_info = this.key_data[idx];
      if (!word_info || word_info == undefined) {
        return "NOTFOUND";
      }
      var defbuf = this._readBuffer(word_info.record_comp_start, word_info.record_compressed_size);
      if (word_info.record_comp_type == "zlib") {
        defbuf = _pako2.default.inflate(defbuf.slice(8, defbuf.length));
      } else {
        return "NOT_SUPPORT_COMPRESS_TYPE";
      }
      if (this.ext == "mdx") {
        return this._decoder.decode(defbuf.slice(word_info.relateive_record_start, word_info.relative_record_end));
      }
      return defbuf.slice(word_info.relateive_record_start, word_info.relative_record_end);
    }
  }]);

  return Mdict;
}(_MdictBase3.default);

exports.default = Mdict;