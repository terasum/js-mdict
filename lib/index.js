"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _pythonStruct = require("python-struct");

var _pythonStruct2 = _interopRequireDefault(_pythonStruct);

var _readChunk = require("read-chunk");

var _readChunk2 = _interopRequireDefault(_readChunk);

var _assert = require("assert");

var _assert2 = _interopRequireDefault(_assert);

var _bl = require("bl");

var _bl2 = _interopRequireDefault(_bl);

var _pako = require("pako");

var _pako2 = _interopRequireDefault(_pako);

var _long = require("long");

var _long2 = _interopRequireDefault(_long);

var _bufferToArraybuffer = require("buffer-to-arraybuffer");

var _bufferToArraybuffer2 = _interopRequireDefault(_bufferToArraybuffer);

var _doublearray = require("doublearray");

var _doublearray2 = _interopRequireDefault(_doublearray);

var _textEncoding = require("text-encoding");

var _common = require("./common");

var _common2 = _interopRequireDefault(_common);

var _lzoWrapper = require("./lzo-wrapper");

var _lzoWrapper2 = _interopRequireDefault(_lzoWrapper);

var _ripemd = require("./ripemd128");

var _ripemd2 = _interopRequireDefault(_ripemd);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
var UTF16 = "UTF-16";

var UTF_8_DECODER = new _textEncoding.TextDecoder("utf-8");
var UTF8 = "UTF-8";

var BIG5_DECODER = new _textEncoding.TextDecoder("big5");
var BIG5 = "BIG5";

var GB18030_DECODER = new _textEncoding.TextDecoder("gb18030");
var GB18030 = "GB18030";

//-----------------------------
//        TOOL METHODS
//-----------------------------


/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 *
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
function _appendBuffer(buffer1, buffer2) {
  var tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}

/**
 * judge num equal or not
 */
function _numEqual(num1, num2) {
  var a = void 0;
  var b = void 0;
  if (!_long2.default.isLong(num1)) {
    a = new _long2.default(num1, 0);
  } else {
    a = num1;
  }
  if (!_long2.default.isLong(num2)) {
    b = new _long2.default(num2, 0);
  } else {
    b = num2;
  }
  return a.eq(b);
}

/**
 *
 * class Mdict, the basic mdict diction parser class
 */

var MDict = function () {
  /**
   *
   * @param {string} fname
   * @param {string} passcode
   */
  function MDict(fname, passcode) {
    _classCallCheck(this, MDict);

    // the mdict file name
    this.fname = fname;
    // the dictionary file decrypt pass code
    this._passcode = passcode;
    // the mdict file read offset
    this._offset = 0;
    // the dictionary file extension
    this.ext = _common2.default.getExtension(fname, "mdx");
    // determine the encoding and decoder, if extension is *.mdd
    if (this.ext === "mdd") {
      this._encoding = UTF16;
      this._decoder = UTF_16LE_DECODER;
    }

    // -------------------------
    // dict header section
    //--------------------------
    // read the diction header info
    this._headerStartOffset = 0;
    this._headerEndOffset = 0;
    this._readHeader();

    // -------------------------
    // dict key header section
    // --------------------------
    this._keyHeaderStartOffset = 0;
    this._keyHeaderEndOffset = 0;
    this.keyHeader = {
      keyBlocksNum: 0,
      entriesNum: 0,
      keyBlockInfoDecompSize: 0,
      keyBlockInfoCompSize: 0,
      keyBlocksTotalSize: 0
    };
    // read key header
    this._readKeyHeader();

    // -------------------------
    // dict key info section
    // --------------------------
    this._keyBlockInfoStartOffset = 0;
    this._keyBlockInfoEndOffset = 0;
    // key block info list
    this.keyBlockInfoList = [];
    // this._readKeyBlockInfo();
    console.log(this.keyBlockInfoList);

    // -------------------------
    // dict key block section
    // --------------------------
    this._keyBlockStartOffset = 0;
    this._keyBlockEndOffset = 0;

    // -------------------------
    // dict record header section
    // --------------------------
    this._recordHeaderStartOffset = 0;
    this._recordHeaderEndOffset = 0;

    // -------------------------
    // dict record info section
    // --------------------------
    this._recordInfoStartOffset = 0;
    this._recordInfoEndOffset = 0;

    // -------------------------
    // dict record block section
    // --------------------------
    this._recordBlockStartOffset = 0;
    this._recordBlockEndOffset = 0;

    // const d1 = new Date().getTime();
    // this._key_list = this._readKeyBlockInfo();
    // const d2 = new Date().getTime();
    // console.log(`read key used: ${(d2 - d1) / 1000.0} s`);

    // const d3 = new Date().getTime();
    // this.key_data = this._decode_record_block();
    // const d4 = new Date().getTime();
    // console.log(`decod record used: ${(d4 - d3) / 1000.0}`);
    // for (let i = 0; i < 10; i++) {
    //   console.log(this.key_data[i].key);
    // }
    // console.log(this.key_data
    // .map(keyword => ({ k: keyword.key, v: keyword })));
    // TODO: out of memory
    // this.bktree = new BKTree(this.key_data.length);
    // this.trie = dart.builder()
    //   .build(this.key_data
    //     .map(keyword =>
    //       // TODO: bktree here will out of memory
    //       // this.bktree.add(keyword.key);
    //       // cousole.log(keyword.key)
    //       ({ k: keyword.key, v: keyword.idx })));
    // const d5 = new Date().getTime();
    // console.log(`dart build used: ${(d5 - d4) / 1000.0} s`);
    // console.log(key_data[0]);
  }

  // returns if word exist or not


  _createClass(MDict, [{
    key: "contains",
    value: function contains(word) {
      if (!this.trie) {
        throw new Error("trie not build finished");
      }
      return this.trie.contain(word);
    }
  }, {
    key: "similar",
    value: function similar(word, tol) {
      return this.bktree.simWords(word, tol);
    }

    // return the word idx

  }, {
    key: "_lookup_idx",
    value: function _lookup_idx(word) {
      if (!this.trie) {
        throw new Error("trie not build finished");
      }
      if (!this.contains(word)) {
        return -1;
      }
      return this.trie.lookup(word);
    }
    // look up the word definition

  }, {
    key: "lookup",
    value: function lookup(word) {
      var idx = this._lookup_idx(word);
      if (idx === -1) {
        return "NOTFOUND";
      }
      return this.parse_defination(idx);
    }
  }, {
    key: "prefix",
    value: function prefix(word) {
      if (!this.trie) {
        throw new Error("trie not init");
      }
      return this.trie.commonPrefixSearch(word);
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
      var _this = this;

      var fuzzy_words = [];
      this.prefix(word).map(function (item) {
        return _this._find_nabor(item.v, fuzzy_size).map(function (w) {
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
      var defbuf = this.__readbuffer(word_info.record_comp_start, word_info.record_compressed_size);
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

    /*
     * Get mdx header info (xml content to object)
     * [0:4], 4 bytes header length (header_byte_size), big-endian, 4 bytes, 16 bits
     * [4:header_byte_size + 4] header_bytes
     * [header_bytes_size + 4:header_bytes_size +8] adler32 checksum
     * should be:
     * assert(zlib.adler32(header_bytes) & 0xffffffff, adler32)
     *
     */

  }, {
    key: "_readHeader",
    value: function _readHeader() {
      // [0:4], 4 bytes header length (header_byte_size), big-endian, 4 bytes, 16 bits
      var header_size_buffer = _readChunk2.default.sync(this.fname, 0, 4);
      var header_byte_size = _pythonStruct2.default.unpack(">I", header_size_buffer)[0];

      // [4:header_byte_size + 4] header_bytes
      var header_b_buffer = _readChunk2.default.sync(this.fname, 4, header_byte_size);

      // TODO: SKIP 4 bytes alder32 checksum
      // header_b_cksum should skip for now, because cannot get alder32 sum by js
      // const header_b_cksum = readChunk.sync(this.fname, header_byte_size + 4, 4);

      // console.log(hash("alder32", header_b_buffer));
      // console.log(header_b_cksum);
      // assert(header_b_cksum), "header_bytes checksum failed");

      // 4 bytes header size + header_bytes_size + 4bytes alder checksum
      this._headerEndOffset = header_byte_size + 4 + 4;

      this._keyHeaderStartOffset = header_byte_size + 4 + 4;

      // set file read offset
      this._offset = this._headerEndOffset;

      // header text in utf-16 encoding ending with `\x00\x00`, so minus 2
      var header_text = _common2.default.readUTF16(header_b_buffer, 0, header_byte_size - 2);

      // parse header info
      this.headerInfo = _common2.default.parseHeader(header_text);

      // encrypted flag
      // 0x00 - no encryption
      // 0x01 - encrypt record block
      // 0x02 - encrypt key info block
      if (!this.headerInfo.Encrypted || this.headerInfo.Encrypted == "" || this.headerInfo.Encrypted == "No") {
        this._encrypt = 0;
      } else if (this.headerInfo.Encrypted == "Yes") {
        this._encrypt = 1;
      } else {
        this._encrypt = parseInt(this.headerInfo.Encrypted, 10);
      }

      // stylesheet attribute if present takes from of:
      // style_number # 1-255
      // style_begin # or ''
      // style_end # or ''
      // TODO: splitstyle info

      // header_info['_stylesheet'] = {}
      // if header_tag.get('StyleSheet'):
      //   lines = header_tag['StyleSheet'].splitlines()
      //   for i in range(0, len(lines), 3):
      //        header_info['_stylesheet'][lines[i]] = (lines[i + 1], lines[i + 2])

      // before version 2.0, number is 4 bytes integer alias, int32
      // version 2.0 and above use 8 bytes, alias int64
      this._version = parseFloat(this.headerInfo.GeneratedByEngineVersion);
      if (this._version >= 2.0) {
        this._numberWidth = 8;
        this._number_format = ">Q";
      } else {
        this._number_format = ">I";
        this._numberWidth = 4;
      }
      console.log(this.headerInfo);
      if (!this.headerInfo.Encoding || this.headerInfo.Encoding == "") {
        this._encoding = UTF8;
        this._decoder = UTF_8_DECODER;
      } else if (this.headerInfo.Encoding == "GBK" || this.headerInfo.Encoding == "GB2312") {
        this._encoding = GB18030;
        this._decoder = GB18030_DECODER;
      } else if (this.headerInfo.Encoding.toLowerCase() == "big5") {
        this._encoding = BIG5;
        this._decoder = BIG5_DECODER;
      } else {
        this._encoding = this.headerInfo.Encoding.toLowerCase() == "utf16" || this.headerInfo.Encoding.toLowerCase() == "utf-16" ? UTF16 : UTF8;
        if (this._encoding == UTF16) {
          this._decoder = UTF_16LE_DECODER;
        } else {
          this._decoder = UTF_8_DECODER;
        }
      }
      // console.log(this._encoding);
    }

    /**
     * read key block header
     */

  }, {
    key: "_readKeyHeader",
    value: function _readKeyHeader() {
      // header info struct:
      // [0:8]/[0:4]   - number of key blocks
      // [8:16]/[4:8]  - number of entries
      // [16:24]/[8:12] - key block info decompressed size (if version >= 2.0, else not exist)
      // [24:32]/null - key block info size
      // [32:40]/[12:16] - key block size
      // note: if version <2.0, the key info buffer size is 4 * 4
      //       otherwise, ths key info buffer size is 5 * 8
      // <2.0  the order of number is same

      // set offset
      this._keyHeaderStartOffset = this._headerEndOffset;

      // version >= 2.0, key_header bytes number is 5 * 8, otherwise, 4 * 4
      var bytesNum = this._version >= 2.0 ? 8 * 5 : 4 * 4;
      this._keyHeaderEndOffset = this._keyHeaderStartOffset + bytesNum;
      var keyHeaderBuff = this._readFile(bytesNum);

      // decrypt
      if (this._encrypt & 1) {
        if (!this._passcode || this._passcode == "") {
          // TODO: encrypted file not support yet
          throw Error(" user identification is needed to read encrypted file");
        }
        // regcode, userid = header_info['_passcode']
        if (this.headerInfo.RegisterBy == "Email") {
          // encrypted_key = _decrypt_regcode_by_email(regcode, userid);
          throw Error("encrypted file not support yet");
        } else {
          throw Error("encrypted file not support yet");
        }
      }

      var keyHeaderOfst = 0;
      // [0:8]   - number of key blocks
      this.keyHeader.keyBlocksNum = this._readNumber(keyHeaderBuff.slice(keyHeaderOfst, keyHeaderOfst + this._numberWidth));
      keyHeaderOfst += this._numberWidth;
      // console.log("num_key_blocks", num_key_blocks.toString());

      // [8:16]  - number of entries
      this.keyHeader.entriesNum = this._readNumber(keyHeaderBuff.slice(keyHeaderOfst, keyHeaderOfst + this._numberWidth));
      keyHeaderOfst += this._numberWidth;
      // console.log("num_entries", num_entries.toString());

      // [16:24] - number of key block info decompress size
      if (this._version >= 2.0) {
        // only for version > 2.0
        var key_block_info_decomp_size = this._readNumber(keyHeaderBuff.slice(keyHeaderOfst, keyHeaderOfst + this._numberWidth));
        keyHeaderOfst += this._numberWidth;
        // console.log(key_block_info_decomp_size.toString());
        this.keyHeader.keyBlockInfoDecompSize = key_block_info_decomp_size;
      }

      // [24:32] - number of key block info compress size
      var keyBlockInfoSize = this._readNumber(keyHeaderBuff.slice(keyHeaderOfst, keyHeaderOfst + this._numberWidth));
      keyHeaderOfst += this._numberWidth;
      // console.log("key_block_info_size", key_block_info_size.toString());
      this.keyHeader.keyBlockInfoCompSize = keyBlockInfoSize;

      // [32:40] - number of key blocks total size, note, key blocks total size, not key block info
      var keyBlocksTotalSize = this._readNumber(keyHeaderBuff.slice(keyHeaderOfst, keyHeaderOfst + this._numberWidth));
      keyHeaderOfst += this._numberWidth;
      // console.log(key_blocks_total_size.toString());
      this.keyHeader.keyBlocksTotalSize = keyBlocksTotalSize;

      // 4 bytes alder32 checksum, after key info block
      // TODO: skip for now, not support yet
      if (this._version >= 2.0) {
        this.__skip_bytes(4);
      }
    }

    /**
     * read key block info
     * key block info list:
     * [{comp_size: xxx, decomp_size: xxx}]
     */

  }, {
    key: "_readKeyBlockInfo",
    value: function _readKeyBlockInfo() {
      this._keyBlockInfoStartOffset = this._keyHeaderEndOffset;
      console.log("aaaaaa", this.keyHeader.keyBlockInfoCompSize);
      var keyBlockInfoBuff = this._readFile(this.__toNumber(this.keyHeader.keyBlockInfoCompSize));
      var keyBlockInfoList = this._decode_key_block_info(this.keyHeader.keyBlocksNum, keyBlockInfoBuff, this.keyHeader.entriesNum);

      (0, _assert2.default)(this.__toNumber(this.keyHeader.keyBlocksNum) === keyBlockInfoList.length, "the num_key_info_list should equals to key_block_info_list");
      this.keyBlockInfoList = keyBlockInfoList;

      // key_block_compress part
      // ====================
      // key_block_compress
      // ====================
      // console.log("key_blocks_total_size", key_blocks_total_size);
      // const key_block_compressed =
      // new BufferList(this._readFile(this.__toNumber(key_blocks_total_size)));

      // -------- 到这里为止都是正确的


      // console.log("key_block_info_list", key_block_info_list);
      //  const key_list = this._decode_key_block(key_block_compressed, key_block_info_list);
      // const key_list = [];
      // console.log("key_list", key_list);
      // this._record_block_offset = this.offset;
      // return key_list;
    }

    // TODO 修改为多线程版本

  }, {
    key: "_decode_key_block",
    value: function _decode_key_block(key_block_compressed, key_block_info_list) {
      // console.log(this._encoding);
      var key_list = [];
      var i = 0;

      // harvest keyblocks
      var keyBlocks = [];
      for (var idx = 0; idx < key_block_info_list.length; idx++) {
        // console.log(" aaa", key_block_info_list[idx], idx);

        var compressed_size = key_block_info_list[idx][0];
        var decompressed_size = key_block_info_list[idx][1];
        var start = i;
        var end = i + compressed_size;
        // 4 bytes : compression type
        var key_block_type = new _bl2.default(key_block_compressed.slice(start, start + 4));
        // # 4 bytes : adler checksum of decompressed key block
        // adler32 = unpack('>I', key_block_compressed[start + 4:start + 8])[0]
        var key_block = void 0;
        if (key_block_type.toString("hex") == "00000000") {
          key_block = key_block_compressed.slice(start + 8, end);
        } else if (key_block_type.toString("hex") == "01000000") {
          // TODO lzo decompress
          // if lzo is None:
          //     print("LZO compression is not supported")
          //     break
          // # decompress key block
          var header = new ArrayBuffer([0xf0, decompressed_size]);
          var keyBlock = _lzoWrapper2.default.decompress(_appendBuffer(header, key_block_compressed.slice(start + 8, end)), decompressed_size, 1308672);
          // lzo.decompress(_appendBuffer(header, key_block_compressed.slice(start + 8, end)));
          key_block = (0, _bufferToArraybuffer2.default)(keyBlock).slice(keyBlock.byteOffset, keyBlock.byteOffset + keyBlock.byteLength);
          // throw Error("lzo compress is not support yet");
        } else if (key_block_type.toString("hex") === "02000000") {
          // decompress key block
          key_block = _pako2.default.inflate(key_block_compressed.slice(start + 8, end));
          // extract one single key block into a key list
          // notice that adler32 returns signed value
          // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)
        } else {
          console.log(key_block_type.toString("hex"));
          throw Error("cannot determine the compress type");
        }

        var splitedKey = this._split_key_block(new _bl2.default(key_block), this._number_format, this._numberWidth, this._encoding);
        key_list = key_list.concat(splitedKey);
        // append to a list
        // TODO
        keyBlocks.push(key_block);
        i += compressed_size;
      }
      // const dkbd04 = new Date().getTime();

      // seprate the decompress and decode
      // TODO promise all
      // const splitedKey = this._split_key_block(
      //   new BufferList(key_block),
      //   this._number_format, this._number_width, this._encoding,
      // );
      // TODO 这里修改为多线程版本
      // const promises = keyBlocks.map(async (key_block) => {
      //   const splitkeys = await
      // });
      // this._split_key_block_helper(keyBlocks, keyBlocks.length);

      // key_list = key_list.concat(splitedKey);

      // const dkbd05 = new Date().getTime();
      // console.log(`readKey#decodeKeyBlock#readOnce#loop#splitKey
      // used ${(dkbd05 - dkbd04) / 1000.0}s`);
      // key_list = key_list.concat(splitedKey);


      // const dkbd2 = new Date().getTime();
      // console.log(`readKey#decodeKeyBlock#readOnce used ${(dkbd2 - dkbd1) / 1000.0}s`);
      console.log(key_list.length);
      return key_list;
    }
  }, {
    key: "_decode_record_block",
    value: function _decode_record_block() {
      var key_data = [];
      // current offset should equals record_block_offset
      (0, _assert2.default)(this.offset == this._record_block_offset, "record offset not equals to current file pointer");
      /**
       * decode the record block info section
       * [0:8/4]    - record blcok number
       * [8:16/4:8] - num entries the key-value entries number
       * [16:24/8:12] - record block info size
       * [24:32/32:40] - record block size
       */
      var num_record_blocks = this._readNumber(this._readFile(this._numberWidth));
      var num_entries = this._readNumber(this._readFile(this._numberWidth));
      (0, _assert2.default)(_numEqual(num_entries, this._num_entries));

      var record_block_info_size = this._readNumber(this._readFile(this._numberWidth));
      var record_block_size = this._readNumber(this._readFile(this._numberWidth));
      /**
       * record_block_info_list => record_block_info:
       * {
       *   1. compressed_size
       *   2. decompressed_size
       * }
       * Note: every record block will contrains a lot of entries
       */
      //  record block info section
      var record_block_info_list = [];
      var size_counter = new _long2.default(0, 0);
      for (var _i = 0; _i < num_record_blocks; _i++) {
        var compressed_size = this._readNumber(this._readFile(this._numberWidth));
        var decompressed_size = this._readNumber(this._readFile(this._numberWidth));
        record_block_info_list.push([compressed_size, decompressed_size]);
        size_counter = size_counter.add(this._numberWidth * 2);
      }
      (0, _assert2.default)(size_counter.eq(record_block_info_size));

      /**
       * start reading the record block
       */
      // # actual record block
      var offset = 0;
      var i = 0;
      size_counter = new _long2.default(0, 0);
      var item_counter = new _long2.default(0, 0);
      var record_offset = 0;
      // throw Error("ffff");
      for (var idx = 0; idx < record_block_info_list.length; idx++) {
        var comp_type = "none";
        var _compressed_size = record_block_info_list[idx][0];
        var _decompressed_size = record_block_info_list[idx][1];
        // console.log(compressed_size, decompressed_size);

        record_offset = this.offset;
        var record_block_compressed = new _bl2.default(this._readFile(this.__toNumber(_compressed_size)));
        // 4 bytes: compression type
        var record_block_type = new _bl2.default(record_block_compressed.slice(0, 4));
        // record_block stores the final record data
        var record_block = void 0;
        // Note: here ignore the checksum part
        // bytes: adler32 checksum of decompressed record block
        // adler32 = unpack('>I', record_block_compressed[4:8])[0]
        if (record_block_type.toString("hex") === "00000000") {
          record_block = record_block_compressed.slice(8, record_block_compressed.length);
        } else {
          var blockBufDecrypted = null;
          // if encrypt type == 1, the record block was encrypted
          if (this._encrypt === 1 /* || (this.ext == "mdd" && this._encrypt === 2 ) */) {
              // const passkey = new Uint8Array(8);
              // record_block_compressed.copy(passkey, 0, 4, 8);
              // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
              blockBufDecrypted = this.__mdx_decrypt(record_block_compressed);
            } else {
            blockBufDecrypted = record_block_compressed.slice(8, record_block_compressed.length);
          }
          if (record_block_type.toString("hex") === "01000000") {
            comp_type = "lzo";
            // throw Error("lzo not support yet!");
            // if (lzo is None){
            //     print("LZO compression is not supported")
            //     break
            // }

            // lzo decompress
            // python example:
            // header = b'\xf0' + pack('>I', decompressed_size)
            // record_block = lzo.decompress(record_block_compressed[start + 8:end],
            //  initSize = decompressed_size, blockSize=1308672)
            // console.log(compressed_size, decompressed_size, blockBufDecrypted.byteLength);

            // the header was need by lzo library, should append before real compressed data
            var header = new ArrayBuffer([0xf0, _decompressed_size]);
            // Note: if use lzo, here will LZO_E_OUTPUT_RUNOVER, so ,use mini lzo js
            record_block = _lzoWrapper2.default.decompress(_appendBuffer(header, blockBufDecrypted), _decompressed_size, 1308672);

            // lzo library decpmpress (failed)
            // record_block = lzo.decompress(_appendBuffer(header, blockBufDecrypted));
            // record_block = lzo.decompress(blockBufDecrypted);
            record_block = (0, _bufferToArraybuffer2.default)(record_block).slice(record_block.byteOffset, record_block.byteOffset + record_block.byteLength);
          } else if (record_block_type.toString("hex") === "02000000") {
            // console.log(record_block_type.toString("hex"));
            comp_type = "zlib";
            // zlib decompress
            record_block = _pako2.default.inflate(blockBufDecrypted);
          }
        }
        record_block = new _bl2.default(record_block);

        // # notice that adler32 return signed value
        // TODO: ignore the checksum
        // assert(adler32 == zlib.adler32(record_block) & 0xffffffff)
        // for debug
        // console.log(record_block.slice(0, 16));
        // console.log(record_block.length);
        // console.log(decompressed_size);

        (0, _assert2.default)(_numEqual(record_block.length, _decompressed_size));
        // # split record block according to the offset info from key block
        /**
         * 请注意，block 是会有很多个的，而每个block都可能会被压缩
         * 而 key_list中的 record_start, key_text是相对每一个block而言的，end是需要每次解析的时候算出来的
         * 所有的record_start/length/end都是针对解压后的block而言的
         */
        while (i < this._key_list.length) {
          var record_start = this._key_list[i][0];
          var key_text = this._key_list[i][1];
          // # reach the end of current record block
          if (record_start - offset >= record_block.length) {
            break;
          }
          // # record end index
          var record_end = void 0;
          if (i < this._key_list.length - 1) {
            record_end = this._key_list[i + 1][0];
          } else {
            record_end = record_block.length + offset;
          }
          i += 1;
          // const data = record_block.slice(record_start - offset, record_end - offset);
          key_data.push({
            key: key_text,
            idx: item_counter.toNumber(),
            // data,
            encoding: this._encoding,
            // record_start,
            // record_end,
            record_idx: idx,
            record_comp_start: record_offset,
            record_compressed_size: _long2.default.isLong(_compressed_size) ? _compressed_size.toNumber() : _compressed_size,
            record_decompressed_size: _long2.default.isLong(_decompressed_size) ? _decompressed_size.toNumber() : _decompressed_size,
            record_comp_type: comp_type,
            record_encrypted: this._encrypt === 1,
            relateive_record_start: record_start - offset,
            relative_record_end: record_end - offset
          });
          // console.log(key_text, this._decoder.decode(data));
          item_counter = item_counter.add(1);
        }
        offset += record_block.length;
        size_counter = size_counter.add(_compressed_size);
      }

      // console.log(size_counter, record_block_size);
      (0, _assert2.default)(size_counter.eq(record_block_size));

      return key_data;
    }

    // Note: for performance, this function will wrappered by
    // a generator function, so this should return a Promise object

  }, {
    key: "_split_key_block",
    value: function _split_key_block(key_block, _number_format, _number_width, _encoding) {
      var key_list = [];
      var key_start_index = 0;
      var key_end_index = 0;

      while (key_start_index < key_block.length) {
        // const temp = key_block.slice(key_start_index, key_start_index + _number_width);
        // # the corresponding record's offset in record block
        var key_id = _pythonStruct2.default.unpack(_number_format, key_block.slice(key_start_index, key_start_index + _number_width))[0];
        // # key text ends with '\x00'
        var delimiter = void 0;
        var width = void 0;
        if (_encoding == "UTF-16") {
          delimiter = "0000";
          width = 2;
        } else {
          delimiter = "00";
          width = 1;
        }
        var i = key_start_index + _number_width;
        while (i < key_block.length) {
          if (new _bl2.default(key_block.slice(i, i + width)).toString("hex") == delimiter) {
            key_end_index = i;
            break;
          }
          i += width;
        }
        var key_text = this._decoder.decode(key_block.slice(key_start_index + _number_width, key_end_index));

        key_start_index = key_end_index + width;
        key_list.push([key_id, key_text]);
      }
      return key_list;
    }
  }, {
    key: "_decode_key_block_info",
    value: function _decode_key_block_info(num_key_blocks, key_info_bl, num_entries) {
      var key_block_info = void 0;
      if (this._version >= 2.0) {
        // zlib compression
        (0, _assert2.default)(key_info_bl.slice(0, 4).toString("hex") === "02000000", "the compress type zlib should start with 0x02000000");
        var key_block_info_compressed = void 0;
        if (this._encrypt === 2) {
          key_block_info_compressed = this.__mdx_decrypt(key_info_bl);
        }
        // For version 2.0, will compress by zlib, lzo just just for 1.0
        // key_block_info_compressed[0:8] => compress_type
        key_block_info = new _bl2.default(_pako2.default.inflate(key_block_info_compressed.slice(8, key_block_info_compressed.length)));
        // TODO: check the alder32 checksum
        // adler32 = unpack('>I', key_block_info_compressed[4:8])[0]
        // assert(adler32 == zlib.adler32(key_block_info) & 0xffffffff)
      } else {
        key_block_info = key_info_bl;
      }
      (0, _assert2.default)(_numEqual(this.headerInfo.key_block_info_decomp_size, key_block_info.length), "key_block_info length should equal");
      var key_block_info_list = [];

      var count_num_entries = new _long2.default(0x00000000, 0x00000000);
      var byte_format = ">H";
      var byte_width = 2;
      var text_term = 1;
      if (this._version >= 2.0) {
        byte_format = ">H";
        byte_width = 2;
        text_term = 1;
      } else {
        byte_format = ">B";
        byte_width = 1;
        text_term = 0;
      }
      // while (i < key_block_info.length) {
      var count = 0;
      var i = 0;
      var key_block_num = _long2.default.isLong(num_key_blocks) ? num_key_blocks.toNumber() : num_key_blocks;
      while (count < key_block_num) {
        // number of entries in current key block

        var tmp_count = _pythonStruct2.default.unpack(this._number_format, key_block_info.slice(i, i + this._numberWidth))[0];
        count_num_entries = count_num_entries.add(tmp_count);
        i += this._numberWidth;

        var first_key_size = _pythonStruct2.default.unpack(byte_format, key_block_info.slice(i, i + byte_width))[0];
        i += byte_width;

        // step gap
        var step_gap = 0;
        // term_size is for first key and last key
        // let term_size = 0;
        if (this._encoding === UTF16) {
          step_gap = (first_key_size + text_term) * 2;
          // term_size = text_term * 2;
        } else {
          step_gap = first_key_size + text_term;
        }
        // TODO: ignore the first key
        // Note: key_block_first_key and last key not need to decode now
        // const key_block_first_key = key_block_info.slice(i, i + step_gap);
        // console.debug("key_block_first_key", this._decoder
        // .decode(key_block_first_key.slice(0, key_block_first_key.length - term_size)));
        i += step_gap;

        // text head
        // if (this._encoding != UTF16) {
        //   i += first_key_size + text_ter;
        // } else {
        //   i += (first_key_size + text_term) * 2;
        // }

        // text tail
        var keyblock_last_key_len = _pythonStruct2.default.unpack(byte_format, key_block_info.slice(i, i + byte_width))[0];
        i += byte_width;
        if (this._encoding === UTF16) {
          step_gap = (keyblock_last_key_len + text_term) * 2;
          // TODO: this is for last key output
          // term_size = text_term * 2;
        } else {
          step_gap = keyblock_last_key_len + text_term;
        }

        // Note: ignore the last key
        // const key_block_last_key = key_block_info.slice(i, i + step_gap);
        // console.log("key_block_last_key", this._decoder
        // .decode(key_block_last_key.slice(0, key_block_last_key.length - term_size)));
        i += step_gap;
        // key block compressed size
        var key_block_compressed_size = _pythonStruct2.default.unpack(this._number_format, key_block_info.slice(i, i + this._numberWidth))[0];
        i += this._numberWidth;
        // key block decompressed size
        var key_block_decompressed_size = _pythonStruct2.default.unpack(this._number_format, key_block_info.slice(i, i + this._numberWidth))[0];
        i += this._numberWidth;
        key_block_info_list.push([this.__toNumber(key_block_compressed_size), this.__toNumber(key_block_decompressed_size)]);
        count += 1;
      }
      (0, _assert2.default)(count_num_entries.equals(num_entries), "the number_entries should equal the count_num_entries");
      return key_block_info_list;
    }

    //-----------------------
    //  assistant functions
    //-----------------------

    // def _mdx_decrypt(comp_block):
    //   key = ripemd128(comp_block[4:8] + pack(b'<L', 0x3695))
    //   return comp_block[0:8] + _fast_decrypt(comp_block[8:], key)

  }, {
    key: "__mdx_decrypt",
    value: function __mdx_decrypt(comp_block) {
      var key = _ripemd2.default.ripemd128(new _bl2.default(comp_block.slice(4, 8)).append(_pythonStruct2.default.pack("<L", 0x3695)).slice(0, 8));
      return new _bl2.default(comp_block.slice(0, 8)).append(this.__fast_decrypt(comp_block.slice(8), key));
    }
  }, {
    key: "__fast_decrypt",
    value: function __fast_decrypt(data, k) {
      var b = new Uint8Array(data);
      var key = new Uint8Array(k);
      var previous = 0x36;
      for (var i = 0; i < b.length; ++i) {
        var t = (b[i] >> 4 | b[i] << 4) & 0xff;
        t = t ^ previous ^ i & 0xff ^ key[i % key.length];
        previous = b[i];
        b[i] = t;
      }
      return new _bl2.default(b);
    }

    // readfile returns a BufferList object which can be easily to use slice method

  }, {
    key: "_readFile",
    value: function _readFile(length) {
      var b = _readChunk2.default.sync(this.fname, this.offset, length);
      this.offset += length;
      return new _bl2.default().append(b);
    }
  }, {
    key: "__readbuffer",
    value: function __readbuffer(start, length) {
      var buf = _readChunk2.default.sync(this.fname, start, length);
      return new _bl2.default(buf);
    }

    // skip those bytes, this is for checksum

  }, {
    key: "__skip_bytes",
    value: function __skip_bytes(num) {
      this.offset += num;
    }

    // read number from buffer use number format,
    // note, you should calc the number length before use this method

  }, {
    key: "_readNumber",
    value: function _readNumber(bf) {
      return _pythonStruct2.default.unpack(this._number_format, bf)[0];
    }
  }, {
    key: "__toNumber",
    value: function __toNumber(number) {
      if (_long2.default.isLong(number)) {
        return number.toNumber();
      }
      return number;
    }
  }]);

  return MDict;
}();

exports.default = MDict;