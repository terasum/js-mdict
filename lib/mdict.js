"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;
var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));
var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));
var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));
var _inherits2 = _interopRequireDefault(require("@babel/runtime/helpers/inherits"));
var _possibleConstructorReturn2 = _interopRequireDefault(require("@babel/runtime/helpers/possibleConstructorReturn"));
var _getPrototypeOf2 = _interopRequireDefault(require("@babel/runtime/helpers/getPrototypeOf"));
var _lemmatizer = require("lemmatizer");
var _dictionaryEnUs = _interopRequireDefault(require("dictionary-en-us"));
var _nspell = _interopRequireDefault(require("nspell"));
var _doublearray = _interopRequireDefault(require("doublearray"));
var _mdictBase = _interopRequireDefault(require("./mdict-base"));
var _common = _interopRequireDefault(require("./common"));
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = (0, _getPrototypeOf2["default"])(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = (0, _getPrototypeOf2["default"])(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return (0, _possibleConstructorReturn2["default"])(this, result); }; }
function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }
var Mdict = /*#__PURE__*/function (_MdictBase) {
  (0, _inherits2["default"])(Mdict, _MdictBase);
  var _super = _createSuper(Mdict);
  function Mdict(fname, options) {
    var _options$passcode, _options$debug, _options$resort, _options$isStripKey, _options$isCaseSensit;
    var _this;
    (0, _classCallCheck2["default"])(this, Mdict);
    options = options || {};
    options = {
      passcode: (_options$passcode = options.passcode) !== null && _options$passcode !== void 0 ? _options$passcode : "",
      debug: (_options$debug = options.debug) !== null && _options$debug !== void 0 ? _options$debug : false,
      resort: (_options$resort = options.resort) !== null && _options$resort !== void 0 ? _options$resort : true,
      isStripKey: (_options$isStripKey = options.isStripKey) !== null && _options$isStripKey !== void 0 ? _options$isStripKey : true,
      isCaseSensitive: (_options$isCaseSensit = options.isCaseSensitive) !== null && _options$isCaseSensit !== void 0 ? _options$isCaseSensit : true
    };
    var passcode = options.passcode || undefined;
    _this = _super.call(this, fname, passcode, options);
    _this.options = options;
    return _this;
  }
  (0, _createClass2["default"])(Mdict, [{
    key: "_binarySearchByResort",
    value: function _binarySearchByResort(word) {
      var _strip = this._stripKeyOrIngoreCase();

      // binary search from keyList
      var start = 0;
      var mid = 0;
      var end = this.keyList.length;
      // target word
      word = _strip(word);
      var keyRecord;
      while (start <= end) {
        mid = start + (end - start >> 1);
        var keyText = _strip(this.keyList[mid].keyText);
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
  }, {
    key: "_prefixBinarySearchByResort",
    value: function _prefixBinarySearchByResort(word) {
      var _strip = this._stripKeyOrIngoreCase();
      var end = this.keyList.length;
      word = _strip(word);
      for (var i = 0; i < end; i++) {
        var keyText = _strip(this.keyList[i].keyText);
        if (keyText.startsWith(word)) {
          return i;
        }
      }
      return -1;
    }
  }, {
    key: "_binarySearchByResort2",
    value: function _binarySearchByResort2(word) {
      var _strip = this._stripKeyOrIngoreCase();
      word = _strip(word);
      for (var i = 0; i < this.keyList.length; i++) {
        if (word == this.keyList[i].keyText) {
          return this.keyList[i];
        }
      }
      return undefined;
    }
  }, {
    key: "_lookupByResort",
    value: function _lookupByResort(word) {
      var keyRecord = this._binarySearchByResort2(word);
      // if not found the key block, return undefined
      if (keyRecord === undefined) {
        return {
          keyText: word,
          definition: null
        };
      }
      var i = keyRecord.original_idx;
      var rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
      var nextStart = i + 1 >= this.keyList.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : this.keyList[this.keyListRemap[i + 1]].recordStartOffset;
      var data = this._decodeRecordBlockByRBID(rid, keyRecord.keyText, keyRecord.recordStartOffset, nextStart);
      return data;
    }

    /**
     *
     * @param {string} word the target word
     * @returns definition
     */
  }, {
    key: "lookup",
    value: function lookup(word) {
      if (this.ext == "mdx" && this.options.resort) {
        return this._lookupByResort(word);
      } else {
        throw new Error("depreciated, use `locate` method to find out mdd resource");
      }
    }

    /**
     * locate mdd resource binary data
     * @param {string} resourceKey resource key
     * @returns resource binary data
     */
  }, {
    key: "locate",
    value: function locate(resourceKey) {
      var record = this._locateResource(resourceKey);

      // if not found the key block, return undefined
      if (record === undefined) {
        return {
          keyText: word,
          definition: null
        };
      }
      var i = record.idx;
      var list = record.list;
      var rid = this._reduceRecordBlock(list[i].recordStartOffset);
      var nextStart = i + 1 >= this.keyList.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : list[i + 1].recordStartOffset;
      var data = this._decodeRecordBlockByRBID(rid, list[i].keyText, list[i].recordStartOffset, nextStart);
      return data;
    }
  }, {
    key: "_lookupRecordBlockWordList",
    value: function _lookupRecordBlockWordList(word) {
      var _this2 = this;
      var lookupInternal = function lookupInternal(compareFn) {
        var sfunc = _this2._stripKeyOrIngoreCase();
        var kbid = _this2._reduceWordKeyBlock(word, sfunc, compareFn);
        // not found
        if (kbid < 0) {
          return undefined;
        }
        var list = _this2._decodeKeyBlockByKBID(kbid);
        var i = _this2._binarySearh(list, word, sfunc, compareFn);
        if (i === undefined) {
          return undefined;
        }
        return list;
      };
      var list;
      if (this._isKeyCaseSensitive()) {
        list = lookupInternal(_common["default"].caseSensitiveCompare);
      } else {
        list = lookupInternal(_common["default"].caseSensitiveCompare);
        if (list === undefined) {
          list = lookupInternal(_common["default"].caseUnSensitiveCompare);
        }
      }
      return list;
    }
  }, {
    key: "_locateResource",
    value: function _locateResource(key) {
      var sfunc = this._stripKeyOrIngoreCase();
      var compareFn;
      if (this._isKeyCaseSensitive()) {
        compareFn = _common["default"].caseSensitiveCompare;
      } else {
        compareFn = _common["default"].caseUnsensitiveCompare;
      }
      var kbid = this._reduceWordKeyBlock(key, sfunc, compareFn);
      // not found
      if (kbid < 0) {
        return undefined;
      }
      var list = this._decodeKeyBlockByKBID(kbid);
      var i = this._binarySearh(list, key, sfunc, compareFn);
      if (i === undefined) {
        return undefined;
      }
      return {
        idx: i,
        list: list
      };
    }
  }, {
    key: "_binarySearh",
    value: function _binarySearh(list, word, _s, compareFn) {
      if (!_s || _s == undefined) {
        _s = this._stripKeyOrIngoreCase();
      }
      var left = 0;
      var right = list.length - 1;
      var mid = 0;
      while (left <= right) {
        mid = left + (right - left >> 1);
        // if case sensitive, the uppercase word is smaller than lowercase word
        // for example: `Holanda` is smaller than `abacaxi`
        // so when comparing with the words, we should use the dictionary order,
        // however, if we change the word to lowercase, the binary search algorithm will be confused
        // so, we use the enhanced compare function `common.wordCompare`
        var compareResult = compareFn(_s(word), _s(list[mid].keyText));
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
  }, {
    key: "_findList",
    value: function _findList(word) {
      var _this3 = this;
      var findListInternal = function findListInternal(compareFn) {
        var sfunc = _this3._stripKeyOrIngoreCase();
        var kbid = _this3._reduceWordKeyBlock(word, sfunc, compareFn);
        // not found
        if (kbid < 0) {
          return undefined;
        }
        return {
          sfunc: sfunc,
          kbid: kbid,
          list: _this3._decodeKeyBlockByKBID(kbid)
        };
      };
      var list;
      if (this._isKeyCaseSensitive()) {
        list = findListInternal(_common["default"].caseSensitiveCompare);
      } else {
        list = findListInternal(_common["default"].caseSensitiveCompare);
        if (list === undefined) {
          list = findListInternal(_common["default"].caseUnsensitiveCompare);
        }
      }
      return list;
    }
  }, {
    key: "_locate_prefix_list",
    value: function _locate_prefix_list(phrase) {
      var max_len = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
      var max_missed = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 100;
      var record = this._prefixBinarySearchByResort(phrase);
      if (record == -1) {
        return [];
      }
      var fn = this._stripKeyOrIngoreCase();
      var list = [];
      var count = 0;
      var missed = 0;
      for (var i = record; i < this.keyList.length; i++) {
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
  }, {
    key: "prefix",
    value: function prefix(phrase) {
      var list = this._locate_prefix_list(phrase);
      if (!list) {
        return [];
      }
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
      var matched = this._locate_prefix_list(phrase, 100);
      // to meet the typings
      matched.map(function (item) {
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
  }, {
    key: "fuzzy_search",
    value: function fuzzy_search(word, fuzzy_size, ed_gap) {
      var fuzzy_words = [];
      var count = 0;
      var fn = this._stripKeyOrIngoreCase();
      for (var i = 0; i < this.keyList.length; i++) {
        var item = this.keyList[i];
        var key = fn(item.keyText);
        var ed = _common["default"].levenshtein_distance(key, fn(word));
        if (ed <= ed_gap) {
          count++;
          if (count > fuzzy_size) {
            break;
          }
          fuzzy_words.push(_objectSpread(_objectSpread({}, item), {}, {
            key: item.keyText,
            idx: item.recordStartOffset,
            ed: ed
          }));
        }
      }
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
      var _this$_locateResource = this._locateResource(word),
        idx = _this$_locateResource.idx,
        list = _this$_locateResource.list;
      var nextStart = idx + 1 >= list.length ? this._recordBlockStartOffset + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator + this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize : list[idx + 1].recordStartOffset;
      var startoffset = list[idx].recordStartOffset;
      if (rstartofset != startoffset) {
        // if args.rstartofset != list[idx].recordStartOffset
        // use args.rstartofset
        startoffset = rstartofset;
      }
      var data = this._decodeRecordBlockByRBID(rid, list[idx].keyText, startoffset, nextStart);
      return data;
    }
  }, {
    key: "parse_def_record",
    value: function parse_def_record(keyRecord) {
      var rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
      var data = this._decodeRecordBlockByRBID(rid, keyRecord.keyText, keyRecord.recordStartOffset, keyRecord.nextRecordStartOffset);
      return data;
    }
  }, {
    key: "rangeKeyWords",
    value: function rangeKeyWords() {
      return this._decodeKeyBlock();
    }
  }]);
  return Mdict;
}(_mdictBase["default"]);
var _default = Mdict;
exports["default"] = _default;