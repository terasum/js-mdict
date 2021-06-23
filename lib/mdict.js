'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lemmatizer = require('lemmatizer');

var _dictionaryEnUs = require('dictionary-en-us');

var _dictionaryEnUs2 = _interopRequireDefault(_dictionaryEnUs);

var _nspell = require('nspell');

var _nspell2 = _interopRequireDefault(_nspell);

var _doublearray = require('doublearray');

var _doublearray2 = _interopRequireDefault(_doublearray);

var _mdictBase = require('./mdict-base');

var _mdictBase2 = _interopRequireDefault(_mdictBase);

var _common = require('./common');

var _common2 = _interopRequireDefault(_common);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /// <reference path="../typings/mdict.d.ts" />

var Mdict = function (_MdictBase) {
  _inherits(Mdict, _MdictBase);

  function Mdict(fname) {
    var searchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Mdict);

    var passcode = searchOptions.passcode || undefined;

    var _this = _possibleConstructorReturn(this, (Mdict.__proto__ || Object.getPrototypeOf(Mdict)).call(this, fname, passcode));

    _this.searchOptions = {};
    searchOptions = searchOptions || {};
    _this.searchOptions.passcode = searchOptions.passcode || undefined;
    _this.searchOptions.keyCaseSensitive = searchOptions.keyCaseSensitive || true;
    _this.searchOptions.stripKey = searchOptions.stripKey || true;
    return _this;
  }

  _createClass(Mdict, [{
    key: '_stripKey',
    value: function _stripKey() {
      var keyCaseSensitive = this.searchOptions.keyCaseSensitive || _common2.default.isTrue(this.header.KeyCaseSensitive);
      var stripKey = this.searchOptions.stripKey || _common2.default.isTrue(this.header.stripKey);
      var regexp = _common2.default.REGEXP_STRIPKEY[this.ext];

      if (this.ext === 'mdd') {
        return function _s(key) {
          return key;
        };
      }

      if (keyCaseSensitive) {
        return stripKey ? function _s(key) {
          return key.replace(regexp, '$1');
        } : function _s(key) {
          return key;
        };
      }

      return this.searchOptions.stripKey || _common2.default.isTrue(this.header.stripKey || (this._version >= 2.0 ? '' : 'yes')) ? function _s(key) {
        return key.toLowerCase().replace(regexp, '$1');
      } : function _s(key) {
        return key.toLowerCase();
      };
    }
  }, {
    key: 'lookup',
    value: function lookup(word) {
      var sfunc = this._stripKey();
      var kbid = this._reduceWordKeyBlock(word, sfunc);
      // not found
      if (kbid < 0) {
        return { keyText: word, definition: null };
      }
      var list = this._decodeKeyBlockByKBID(kbid);
      var i = this._binarySearh(list, word, sfunc);
      // if not found the key block, return undefined
      if (!list[i]) return undefined;
      var rid = this._reduceRecordBlock(list[i].recordStartOffset);
      var nextStart = i + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : list[i + 1].recordStartOffset;
      var data = this._decodeRecordBlockByRBID(rid, list[i].keyText, list[i].recordStartOffset, nextStart);
      return data;
    }
  }, {
    key: '_lookupKID',
    value: function _lookupKID(word) {
      var sfunc = this._stripKey();
      var kbid = this._reduceWordKeyBlock(word, sfunc);
      var list = this._decodeKeyBlockByKBID(kbid);
      var i = this._binarySearh(list, word, sfunc);
      return { idx: i, list: list };
    }
  }, {
    key: '_binarySearh',
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
        // if case sensitive, the uppercase word is smaller than lowercase word
        // for example: `Holanda` is smaller than `abacaxi`
        // so when comparing with the words, we should use the dictionary order,
        // however, if we change the word to lowercase, the binary search algorithm will be confused
        // so, we use the enhanced compare function `common.wordCompare`
        var compareResult = this.compareFn(_s(word), _s(list[mid].keyText));
        // console.log(`@#@# wordCompare ${_s(word)} ${_s(list[mid].keyText)} ${compareResult} l: ${left} r: ${right} mid: ${mid} ${list[mid].keyText}`)
        if (compareResult > 0) {
          left = mid + 1;
        } else if (compareResult == 0) {
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

  }, {
    key: 'prefix',
    value: function prefix(phrase) {
      var sfunc = this._stripKey();
      var kbid = this._reduceWordKeyBlock(phrase, sfunc);
      var list = this._decodeKeyBlockByKBID(kbid);
      var trie = _doublearray2.default.builder().build(list.map(function (keyword) {
        return {
          k: keyword.keyText,
          v: keyword.recordStartOffset
        };
      }));
      return trie.commonPrefixSearch(phrase).map(function (item) {
        return { key: item.k, rofset: item.v };
      });
    }

    /**
     * get words associated
     * @param {string} phrase the word which needs to be associated
     */

  }, {
    key: 'associate',
    value: function associate(phrase) {
      var sfunc = this._stripKey();
      var kbid = this._reduceWordKeyBlock(phrase, sfunc);
      var list = this._decodeKeyBlockByKBID(kbid);
      var matched = list.filter(function (item) {
        return sfunc(item.keyText).startsWith(sfunc(phrase));
      });
      if (!matched.length) return matched;
      // in case there are matched items in next key block
      while (matched[matched.length - 1].keyText === list[list.length - 1].keyText && kbid < this.keyBlockInfoList.length) {
        kbid++;
        list = this._decodeKeyBlockByKBID(kbid);
        matched.concat(list.filter(function (item) {
          return sfunc(item.keyText).startsWith(sfunc(phrase));
        }));
      }
      // to meet the typings
      matched.map(function (item) {
        item.rofset = item.recordStartOffset;
      });

      return matched;
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
    key: 'fuzzy_search',
    value: function fuzzy_search(word, fuzzy_size, ed_gap) {
      var _this2 = this;

      var fwords = [];
      var fuzzy_words = [];
      fwords = fwords.concat(this.prefix(word).map(function (kv) {
        return {
          key: kv.key,
          idx: kv.rofset,
          ed: _common2.default.levenshtein_distance(word, kv.k)
        };
      }));
      fuzzy_size = fuzzy_size - fwords.length < 0 ? 0 : fuzzy_size - fwords.length;
      fwords.map(function (fw) {
        var _lookupKID2 = _this2._lookupKID(fw.key),
            idx = _lookupKID2.idx,
            list = _lookupKID2.list;

        return _this2._find_nabor(idx, Math.ceil(fuzzy_size / fwords.length), list).filter(function (item) {
          return _common2.default.levenshtein_distance(item.keyText, word) <= ed_gap;
        }).map(function (kitem) {
          return fuzzy_words.push({
            key: kitem.keyText,
            rofset: kitem.recordStartOffset,
            ed: _common2.default.levenshtein_distance(word, kitem.keyText)
          });
        });
      });
      return fuzzy_words;
    }

    /**
     * return word's lemmatizer
     * @param {string} phrase word phrase
     */

  }, {
    key: 'lemmer',
    value: function lemmer(phrase) {
      return (0, _lemmatizer.lemmatizer)(phrase);
    }
  }, {
    key: '_loadSuggDict',
    value: function _loadSuggDict() {
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
    key: 'suggest',
    value: function suggest(phrase) {
      return this._loadSuggDict().then(function (dict) {
        var spell = (0, _nspell2.default)(dict);
        return spell.suggest(phrase);
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: '_find_nabor',
    value: function _find_nabor(idx, fuzsize, list) {
      var imax = list.length;
      var istart = idx - fuzsize < 0 ? 0 : idx - fuzsize;
      var iend = idx + fuzsize > imax ? imax : idx + fuzsize;
      return list.slice(istart, iend);
    }

    /**
     * parse the definition by word and ofset
     * @param {string} word the target word
     * @param {number} rstartofset the record start offset (fuzzy_start rofset)
     */

  }, {
    key: 'parse_defination',
    value: function parse_defination(word, rstartofset) {
      var rid = this._reduceRecordBlock(rstartofset);

      var _lookupKID3 = this._lookupKID(word),
          idx = _lookupKID3.idx,
          list = _lookupKID3.list;

      var nextStart = idx + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : list[idx + 1].recordStartOffset;
      var data = this._decodeRecordBlockByRBID(rid, list[idx].keyText, list[idx].recordStartOffset, nextStart);
      return data;
    }
  }]);

  return Mdict;
}(_mdictBase2.default);

exports.default = Mdict;