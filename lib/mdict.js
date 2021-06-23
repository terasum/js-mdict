"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _lemmatizer = require("lemmatizer");

var _dictionaryEnUs = _interopRequireDefault(require("dictionary-en-us"));

var _nspell = _interopRequireDefault(require("nspell"));

var _doublearray = _interopRequireDefault(require("doublearray"));

var _mdictBase = _interopRequireDefault(require("./mdict-base"));

var _common = _interopRequireDefault(require("./common"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var Mdict = /*#__PURE__*/function (_MdictBase) {
  _inherits(Mdict, _MdictBase);

  var _super = _createSuper(Mdict);

  function Mdict(fname) {
    var _this;

    var searchOptions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    _classCallCheck(this, Mdict);

    var passcode = searchOptions.passcode || undefined;
    _this = _super.call(this, fname, passcode);
    _this.searchOptions = {};
    searchOptions = searchOptions || {};
    _this.searchOptions.passcode = searchOptions.passcode || undefined;
    _this.searchOptions.keyCaseSensitive = searchOptions.keyCaseSensitive;
    _this.searchOptions.stripKey = searchOptions.stripKey;
    return _this;
  }

  _createClass(Mdict, [{
    key: "_stripKey",
    value: function _stripKey() {
      var keyCaseSensitive = this.searchOptions.keyCaseSensitive || _common["default"].isTrue(this.header.KeyCaseSensitive);

      var stripKey = this.searchOptions.stripKey || _common["default"].isTrue(this.header.stripKey);

      var regexp = _common["default"].REGEXP_STRIPKEY[this.ext];

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

      return this.searchOptions.stripKey || _common["default"].isTrue(this.header.stripKey || (this._version >= 2.0 ? '' : 'yes')) ? function _s(key) {
        return key.toLowerCase().replace(regexp, '$1');
      } : function _s(key) {
        return key.toLowerCase();
      };
    }
  }, {
    key: "lookup",
    value: function lookup(word) {
      var sfunc = this._stripKey();

      var kbid = this._reduceWordKeyBlock(word, sfunc); // not found


      if (kbid < 0) {
        return {
          keyText: word,
          definition: null
        };
      }

      var list = this._decodeKeyBlockByKBID(kbid);

      var i = this._binarySearh(list, word, sfunc); // if not found the key block, return undefined


      if (i !== -1) return {
        keyText: word,
        definition: null
      };

      var rid = this._reduceRecordBlock(list[i].recordStartOffset);
      var nextStart = i + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompSize : list[i + 1].recordStartOffset;
      var data = this._decodeRecordBlockByRBID(rid, list[i].keyText, list[i].recordStartOffset, nextStart);

      return data;
    }
  }, {
    key: "_lookupKID",
    value: function _lookupKID(word) {
      var sfunc = this._stripKey();

      var kbid = this._reduceWordKeyBlock(word, sfunc);

      var list = this._decodeKeyBlockByKBID(kbid);

      var i = this._binarySearh(list, word, sfunc);

      return {
        idx: i,
        list: list
      };
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
        mid = left + (right - left >> 1); // if case sensitive, the uppercase word is smaller than lowercase word
        // for example: `Holanda` is smaller than `abacaxi`
        // so when comparing with the words, we should use the dictionary order,
        // however, if we change the word to lowercase, the binary search algorithm will be confused
        // so, we use the enhanced compare function `common.wordCompare`

        var compareResult = this.compareFn(_s(word), _s(list[mid].keyText)); // console.log(`@#@# wordCompare ${_s(word)} ${_s(list[mid].keyText)} ${compareResult} l: ${left} r: ${right} mid: ${mid} ${list[mid].keyText}`)

        if (compareResult > 0) {
          left = mid + 1;
        } else if (compareResult == 0) {
          return mid;
        } else {
          right = mid - 1;
        }
      }

      return -1;
    }
    /**
     * get word prefix words
     * @param {string} phrase the word which needs to find prefix
     */

  }, {
    key: "prefix",
    value: function prefix(phrase) {
      var sfunc = this._stripKey();

      var kbid = this._reduceWordKeyBlock(phrase, sfunc);

      var list = this._decodeKeyBlockByKBID(kbid);

      var trie = _doublearray["default"].builder().build(list.map(function (keyword) {
        return {
          k: keyword.keyText,
          v: keyword.recordStartOffset
        };
      }));

      return trie.commonPrefixSearch(phrase).map(function (item) {
        return {
          key: item.k,
          rofset: item.v
        };
      });
    }
    /**
     * get words associated
     * @param {string} phrase the word which needs to be associated
     */

  }, {
    key: "associate",
    value: function associate(phrase) {
      var sfunc = this._stripKey();

      var kbid = this._reduceWordKeyBlock(phrase, sfunc);

      var list = this._decodeKeyBlockByKBID(kbid);

      var matched = list.filter(function (item) {
        return sfunc(item.keyText).startsWith(sfunc(phrase));
      });
      if (!matched.length) return matched; // in case there are matched items in next key block

      while (matched[matched.length - 1].keyText === list[list.length - 1].keyText && kbid < this.keyBlockInfoList.length) {
        kbid++;
        list = this._decodeKeyBlockByKBID(kbid);
        matched.concat(list.filter(function (item) {
          return sfunc(item.keyText).startsWith(sfunc(phrase));
        }));
      } // to meet the typings


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
    key: "fuzzy_search",
    value: function fuzzy_search(word, fuzzy_size, ed_gap) {
      var _this2 = this;

      var fwords = [];
      var fuzzy_words = [];
      fwords = fwords.concat(this.prefix(word).map(function (kv) {
        return {
          key: kv.key,
          idx: kv.rofset,
          ed: _common["default"].levenshtein_distance(word, kv.k)
        };
      }));
      fuzzy_size = fuzzy_size - fwords.length < 0 ? 0 : fuzzy_size - fwords.length;
      fwords.map(function (fw) {
        var _this2$_lookupKID = _this2._lookupKID(fw.key),
            idx = _this2$_lookupKID.idx,
            list = _this2$_lookupKID.list;

        return _this2._find_nabor(idx, Math.ceil(fuzzy_size / fwords.length), list).filter(function (item) {
          return _common["default"].levenshtein_distance(item.keyText, word) <= ed_gap;
        }).map(function (kitem) {
          return fuzzy_words.push({
            key: kitem.keyText,
            rofset: kitem.recordStartOffset,
            ed: _common["default"].levenshtein_distance(word, kitem.keyText)
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
    key: "lemmer",
    value: function lemmer(phrase) {
      return (0, _lemmatizer.lemmatizer)(phrase);
    }
  }, {
    key: "_loadSuggDict",
    value: function _loadSuggDict() {
      return new Promise(function (resolve, reject) {
        function onDictLoad(err, dict) {
          if (err) {
            reject(err);
          }

          resolve(dict);
        }

        (0, _dictionaryEnUs["default"])(onDictLoad);
      });
    }
  }, {
    key: "suggest",
    value: function suggest(phrase) {
      return this._loadSuggDict().then(function (dict) {
        var spell = (0, _nspell["default"])(dict);
        return spell.suggest(phrase);
      }, function (err) {
        throw err;
      });
    }
  }, {
    key: "_find_nabor",
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
    key: "parse_defination",
    value: function parse_defination(word, rstartofset) {
      var rid = this._reduceRecordBlock(rstartofset);

      var _this$_lookupKID = this._lookupKID(word),
          idx = _this$_lookupKID.idx,
          list = _this$_lookupKID.list;

<<<<<<< HEAD
      var nextStart = idx + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : list[idx + 1].recordStartOffset;

=======
      var nextStart = idx + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].keyBlockDecompSize : list[idx + 1].recordStartOffset;
>>>>>>> parent of f44d84f... fix(mdict.js): correct property name (#33)
      var data = this._decodeRecordBlockByRBID(rid, list[idx].keyText, list[idx].recordStartOffset, nextStart);

      return data;
    }
  }]);

  return Mdict;
}(_mdictBase["default"]);

var _default = Mdict;
exports["default"] = _default;