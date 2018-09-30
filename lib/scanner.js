"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); // import fs from "fs";

// below is for debug

// import lzo from "./lzo";


var _pako = require("pako");

var _pako2 = _interopRequireDefault(_pako);

var _lzo = require("lzo");

var _lzo2 = _interopRequireDefault(_lzo);

var _textEncoding = require("text-encoding");

var _bufferToArraybuffer = require("buffer-to-arraybuffer");

var _bufferToArraybuffer2 = _interopRequireDefault(_bufferToArraybuffer);

var _xmldom = require("xmldom");

var _ripemd = require("./ripemd128");

var _ripemd2 = _interopRequireDefault(_ripemd);

var _common = require("./common");

var _common2 = _interopRequireDefault(_common);

var _RecordBlockTable = require("./RecordBlockTable");

var _RecordBlockTable2 = _interopRequireDefault(_RecordBlockTable);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// import int64Buffer from "int64-buffer";

// import { linenumber } from "@everymundo/linenumber";
// const ln = linenumber;

// const DEBUG = (...args) => console.log(__filename, args);

// A shared UTF16LE text decorder used to read
// the dictionary header string.
var UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
var UTF16 = "UTF-16";

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

function bufferEqual(buf1, buf2) {
  if (buf1.byteLength != buf2.byteLength) return false;
  var dv1 = new Int8Array(buf1);
  var dv2 = new Int8Array(buf2);
  for (var i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false;
  }
  return true;
}

// searchTextLen need search the 'NUL' character which
function searchTextLen(dv, offset, encoding) {
  // UTF-16
  if (encoding === UTF16) {
    var _ofset = offset;
    var _mark = offset;
    while (dv.getUint16(_ofset++)) {/* scan  for NUL */}
    return _ofset - _mark;
  }
  // UTF-8 or GBK or Big5
  var ofset = offset;
  var mark = offset;
  while (dv.getUint8(ofset++)) {/* scan for NUL */}
  return ofset - mark - 1;
}

/*
 * Decrypt encrypted data block of keyword index (attrs.Encrypted = "2").
 * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#keyword-index-encryption
 * @param buf an ArrayBuffer containing source data
 * @param key an ArrayBuffer holding decryption key,
 * which will be supplied to ripemd128() before decryption
 * @return an ArrayBuffer carrying decrypted data, occupying the same memory space of source buffer
 */
// TODO: use C implemention
function decrypt(buf, bkey) {
  var key = _ripemd2.default.ripemd128(bkey);
  var byte = void 0;
  var keylen = key.length;
  var len = buf.length;
  var decbuf = new Uint8Array(len); // eslint-disable-line prefer-const
  var prev = 0x36;
  for (var i = 0; i < len; i += 1) {
    byte = buf[i];
    byte = byte >> 4 | byte << 4; // eslint-disable-line no-bitwise
    byte = byte ^ prev ^ i & 0xFF ^ key[i % keylen]; // eslint-disable-line no-bitwise
    prev = buf[i];
    decbuf[i] = byte; // eslint-disable-line no-param-reassign
  }
  return decbuf;
}

/**
 * Test if a value of dictionary attribute is true or not.
 */
function isTrue(v) {
  var _v = ("" + (v || false)).toLowerCase();
  return _v === "yes" || _v === "true";
}

/**
* Read the first 4 bytes of mdx/mdd file to get length of header_str.
* @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#file-structure
* @param input sliced file (start = 0, length = 4)
* @return length of header_str
*/
// function readFileHead() {
//   // TODO:

// }

/**
 * Return the first argument as result
 * This function is used to simulate consequence, i.e. read data and return it,
 * then forward to a new position
 * @param {*} args the muti-arguments
 */
function conseq() {
  return arguments.length <= 0 ? undefined : arguments[0];
}

function newUint8Array(buf, offset, len) {
  var ret = new Uint8Array(len);
  ret = Buffer.from(buf, offset, offset + len);
  return ret;
}

var Scanner = function () {
  function Scanner(buf, ext) {
    _classCallCheck(this, Scanner);

    this.ext = ext;
    this.buffer = buf instanceof Buffer ? (0, _bufferToArraybuffer2.default)(buf) : buf;
    this.offset = 0;
    // dataView instance
    this.dv = new DataView(this.buffer);

    /*--------------------------------
     *  configurations (attributes)
     *-------------------------------*/
    this.attrs = {}; // diction attributes
    this._v2 = false; // true if engine version >2
    this._bpu = 0x0; // bytes per unit when converting text size to byte length for text data
    this._tail = 0; // need to skip extra tail bytes after decoding text
    this._decoder = null; // text decorder
    //  if < 2.0: number_width  = 4
    //  else number_width = 8;
    this._number_width = 4;
    // < 2.0 format >I big-endian uint32
    // >= 2.0 >Q big-endian uint64 (unsigned long long uint64)
    this._number_format = "uint32";

    this._decryptors = [false, false];
    // [keyword_header_decryptor, keyword_index_decryptor],
    // only keyword_index_decryptor is supported

    // read a "short" number representing kewword text size,
    // 8-bit for version < 2, 16-bit for version >= 2
    this.readShort = this.readUint8;

    // Read a number representing offset or data block size,
    // 16-bit for version < 2, 32-bit for version >= 2
    this.readNum = this.readUInt32; //

    // Version >= 2.0 only
    this._checksum_v2 = function () {};
    // adapt key by converting to lower case or stripping punctuations
    // according to dictionary attributes (KeyCaseSensitive, StripKey)
    this._adaptKey = function (key) {
      return key;
    };
  }
  /**
   * config the scanner during reading the dictionary file
   * accroding to the header contents, the dictionary
   * attributes can be determined
   */


  _createClass(Scanner, [{
    key: "config",
    value: function config() {
      this.attrs.Encoding = this.attrs.Encoding || UTF16;
      this._decoder = new _textEncoding.TextDecoder(this.attrs.Encoding || UTF16);
      this._bpu = this.attrs.Encoding === UTF16 ? 2 : 1;
      // Version specification configurations
      if (Number.parseInt(this.attrs.GeneratedByEngineVersion, 10) >= 2.0) {
        this._v2 = true;
        this._tail = this._bpu;
        this._number_format = "uint64";
        this._number_width = 8;
        this.readNum = this.readUInt64;
        this.readShort = this.readUInt16;
      } else {
        this._tail = 0;
      }

      // encryption
      if (this.attrs.Encrypted & 0x02) {
        this._decryptors[1] = decrypt;
      }

      var regexp = _common2.default.REGEXP_STRIPKEY[this.ext];
      if (isTrue(this.attrs.KeyCaseSensitive)) {
        this._adaptKey = isTrue(this.attrs.StripKey) ? function (key) {
          return key.replace(regexp, "$1");
        } : function (key) {
          return key;
        };
      } else {
        this._adaptKey = isTrue(this.attrs.StripKey || (this._v2 ? "" : "yes")) ? function (key) {
          return key.toLowerCase().replace(regexp, "$1");
        } : function (key) {
          return key.toLowerCase();
        };
      }
    }

    /**
    *
    * @param {*Number offset the file buffer offset needs to read
    * @param {*Number len the bytes length needs to read
    */

  }, {
    key: "slice",
    value: function slice(offset, len) {
      return (0, _bufferToArraybuffer2.default)(Buffer.from(this.buffer, offset, len));
    }
  }, {
    key: "checksum",
    value: function checksum() {
      return this.readUInt32();
    }
  }, {
    key: "checksumV2",
    value: function checksumV2() {
      return this.checksum();
    }

    // update offset to new posotion

  }, {
    key: "forward",
    value: function forward(len) {
      this.offset += len;
    }

    // return current offset

  }, {
    key: "offset",
    value: function offset() {
      return this.offset;
    }

    // 32-bit unsigned int represents header part length

  }, {
    key: "readUInt32",
    value: function readUInt32() {
      return conseq(this.dv.getUint32(this.offset, 0), this.forward(4));
    }
  }, {
    key: "readUInt64",
    value: function readUInt64() {
      this.forward(4);
      return this.readUInt32();
    }
    // 16-bit unsigned int

  }, {
    key: "readUInt16",
    value: function readUInt16() {
      return conseq(this.dv.getUint16(this.offset, false), this.forward(2));
    }

    // 8-bit unsigned int

  }, {
    key: "readUint8",
    value: function readUint8() {
      return conseq(this.dv.getUint8(this.offset, false), this.forward(1));
    }

    // read a "short" number represents keyword text size,
    // 8-bit for version < 2, 16-bit for version >= 2

  }, {
    key: "readShort",
    value: function readShort() {
      return this.readUint8();
    }

    // read a number represents offset or data block size,
    // 16-bit for version < 2, 32-bit for version >= 2

  }, {
    key: "readNum",
    value: function readNum() {
      return this.readUInt32();
    }

    // read the header keys which encoded by utf16le

  }, {
    key: "readUTF16",
    value: function readUTF16(len) {
      return conseq(UTF_16LE_DECODER.decode(newUint8Array(this.buffer, this.offset, len)));
    }

    // Read data to an Uint8Array and decode it to text with specified encoding.
    // @param len length in basic unit, need to multiply byte per unit to get length in bytes
    // NOTE: After decoding the text, it is need to forward extra "tail" bytes
    // according to specified encoding.

  }, {
    key: "readTextSized",
    value: function readTextSized(len) {
      var length = len * this._bpu;
      var read = conseq(this._decoder.decode(newUint8Array(this.buffer, this.offset, length)), this.forward(length + this._tail));
      return read;
    }
    /**
     * read the definiation block, decompress or decrypt
     * @param {*} compSize compression size
     * @param {*} decompSize decompression size
     * @param {*} decryptor decrypt algoritm
     * @return {Buffer} decompressed buffer
     */

  }, {
    key: "readBlock",
    value: function readBlock(blockBuf, compSize, decompSize, decryptor) {
      var dv = new DataView(blockBuf);
      var start = 0;
      var end = start + compSize;
      var block = null;
      // compression type, 0 = non, 1 = lzo, 2 = gzip;
      var compType = dv.getUint8(start, false);
      if (compType === 0) {
        block = blockBuf.slice(start + 8, end);
      } else {
        var blockBufDecrypted = null;
        if (decryptor) {
          // TODO: decryption
          var passkey = new Uint8Array(8);
          blockBuf.copy(passkey, 0, start + 4, start + 8);
          passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
          blockBufDecrypted = decryptor(blockBuf.slice(start + 8, end), passkey);
        } else {
          blockBufDecrypted = blockBuf.slice(start + 8, end);
        }
        if (compType === 1) {
          // lzo
          var header = new ArrayBuffer([0xf0, decompSize]);
          block = _lzo2.default.decompress(_appendBuffer(header, blockBufDecrypted));
          block = (0, _bufferToArraybuffer2.default)(block).slice(block.byteOffset, block.byteOffset + block.byteLength);
        } else if (compType === 2) {
          // gzip
          block = _pako2.default.inflate(blockBufDecrypted);
        }
      }

      return block;
    }

    /**
     * Read the first 4 bytes of mdx/mdd file to get length of header_str.
     * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#file-structure
     * input sliced file (start = 0, length = 4)
     * @return length of header_str
     */

  }, {
    key: "readFileHeaderSize",
    value: function readFileHeaderSize() {
      // auto-forward
      return this.readUInt32();
    }
    /**
     * Read header section, parse dictionary attributes and config scanner
     * according to engine version attribute.
     * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#header-section
     * @param input sliced file (start = 4, length = len + 48),
     * header string + header section (max length 48)
     * @param len length of header_str
     * Note: header_str.length should + 48
     * @return the header attributes object
     */

  }, {
    key: "readHeaderSect",
    value: function readHeaderSect(len) {
      var headerStr = this.readUTF16(len).replace(/\0$/, ""); // need to remove tailing NUL
      // parse dictionary attributes
      var doc = new _xmldom.DOMParser().parseFromString(headerStr, "text/xml");
      var elem = doc.getElementsByTagName("Dictionary")[0];
      if (!elem) {
        elem = doc.getElementsByTagName("Library_Data")[0]; // eslint_disable_prefer_destructing
      }
      // console.log(doc.getElementsByTagName("Dictionary")[0].attributes);

      // var xml = parseXml(header_str).querySelector('Dictionary, Library_Data').attributes;

      for (var i = 0, item; i < elem.attributes.length; i++) {
        item = elem.attributes[i];
        this.attrs[item.nodeName] = item.nodeValue;
      }

      this.attrs.Encrypted = parseInt(this.attrs.Encrypted, 10) || 0;
      // reconfigure by header section
      this.config();
      return this.attrs;
    }

    /**
     * Read keyword summary at the begining of keyword section.
     * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#keyword-section
     * @param ofst move formard summary start offset,
     * start position of keyword section in sliced file,
     * equals to length of header string plus checksum.
     * @return keyword_sect object
     */

  }, {
    key: "readKeywordSummary",
    value: function readKeywordSummary(ofst /* header_remain_len */) {
      var mark = this.offset + ofst; /* header_remain_len */
      // 2504
      this.forward(ofst);
      // offset = 834
      var ret = {
        numBlocks: this.readNum(), // 842
        numEntries: this.readNum(), // 850
        keyIndexDeCompLen: this._v2 && this.readNum(), // Ver >= 2.0 only // 858
        keyIndexCompLen: this.readNum(), // 864
        keyBlockLen: this.readNum(), // 872
        // forward (4)
        checksum: this._v2 ? this.forward(4) && 0 : 0,
        len: this.offset - mark
        // actual length of keyword section, varying with engine version attribute
      };
      return ret;
    }
    /**
     * Read keyword index part of keyword section.
     * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#keyword-header-encryption
     * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#keyword-index
     * @param input sliced file, remained part of keyword section after keyword
     * summary which can also be used to read following key blocks.
     * @param keywordSummary
     * @return [keyword_summary, array of keyword index]
     */

  }, {
    key: "readKeywordIndex",
    value: function readKeywordIndex(keywordSummary) {
      // const blockScanner = this.readBlock(
      //   keywordSummary.keyIndexCompLen,
      //   keywordSummary.keyIndexDecompLen,
      //   this._decryptors[1],
      // );
      // compressed key block info
      var keyBlockInfoCompressed = this.slice(this.offset, keywordSummary.keyIndexCompLen);
      var kbcdv = new DataView(keyBlockInfoCompressed);
      var compType = kbcdv.getUint8(0);
      var keyBlockInfo = null;
      var start = 0;
      var end = keywordSummary.keyIndexCompLen;
      if (compType === 0) {
        if (this._v2) {
          keyBlockInfo = keyBlockInfoCompressed.slice(start + 8, end);
        }
        keyBlockInfo = keyBlockInfoCompressed;
      } else {
        var passkey = keyBlockInfoCompressed.slice(start + 4, start + 8);
        keyBlockInfoCompressed = keyBlockInfoCompressed.slice(start + 8, end);
        // decrypt
        if (this.attrs.Encrypted === 2) {
          var passKey = _appendBuffer(passkey, Buffer.from([0x95, 0x36, 0x00, 0x00]));
          var kbiDecrypted = decrypt(new Uint8Array(keyBlockInfoCompressed), new Uint8Array(passKey));
          keyBlockInfoCompressed = (0, _bufferToArraybuffer2.default)(kbiDecrypted);
        }

        keyBlockInfo = compType === 2 ? _pako2.default.inflate(keyBlockInfoCompressed) : _lzo2.default.decompress(keyBlockInfoCompressed, keywordSummary.keyIndexDecompLen, 1308672);
      }
      /** ***********************************
      * starts to decode the keyBlockInfo
      ************************************ */
      // new keyBlockInfo data view
      // const kbdv = new DataView(keyBlockInfo);
      if (keyBlockInfo instanceof Uint8Array) {
        keyBlockInfo = keyBlockInfo.buffer;
      }

      var keyBlockInfoScanner = new Scanner(keyBlockInfo);
      keyBlockInfoScanner.attrs = this.attrs;
      keyBlockInfoScanner._bpu = this._bpu;
      keyBlockInfoScanner._tail = this._tail;
      keyBlockInfoScanner.config("key INDEX");
      // keyBlockInfoScanner.forward(8);

      var keywordIndex = Array(keywordSummary.numBlocks);
      var offset = 0;

      for (var i = 0, size; i < keywordSummary.numBlocks; i++) {
        // for (let i = 0, size; i < 2; i++) {
        keywordIndex[i] = {
          num_entries: conseq(keyBlockInfoScanner.readNum()),
          // UNUSED, can be ignored
          first_size: size = keyBlockInfoScanner.readShort(),
          // TODO: readTextSized will be out of bound
          // UNYSED, can be ignored
          // first_word: conseq(keyBlockInfoScanner.readTextSized(size)),
          first_word: keyBlockInfoScanner.forward(size + keyBlockInfoScanner._tail),
          // UNUSED, can be ignored
          last_size: size = keyBlockInfoScanner.readShort(),
          // last_word: keyBlockInfoScanner.readTextSized(size),
          last_word: keyBlockInfoScanner.forward(size + keyBlockInfoScanner._tail),
          comp_size: size = keyBlockInfoScanner.readNum(),
          decomp_size: keyBlockInfoScanner.readNum(),
          // extra fields
          offset: offset, // offset of the first byte for the target key block in mdx/mdd file
          index: i // index of this key index, used to search previous/next block
        };
        offset += size;
      }
      this.forward(keywordSummary.keyIndexCompLen);
      return keywordIndex;
    }

    /**
     * readAllKeyBlock to get a keys list
     * @param {Object} keyWordIndex the keyWordIndex object
     * @param {ArrayBuffer} keyBlockBuffer the whole ArrayBuffer
     */

  }, {
    key: "readKeyBlock",
    value: function readKeyBlock(keyWordIndex, keyBlockBuffer) {
      var i = 0;
      var keyList = new Array(0);
      var dataView = new DataView(keyBlockBuffer);
      for (var j = 0; j < keyWordIndex.length; j++) {
        // console.log(j, keyWordIndex.length);
        var keyWordIdx = keyWordIndex[j];
        // console.log(keyWordIdx);
        // console.log("Scanner.js:576", "i", i);
        var start = i;
        var end = i + keyWordIdx.comp_size;
        // 4 bytes: compression type
        var keyBlockType = dataView.getUint8(start);
        // 4 bytes : adler32 checksum of decompressed key block
        // TODO: checksum check
        // const adler32 = dataView.getUint32(start + 4, start + 8);
        var keyBlock = null;
        if (keyBlockType === 0) {
          keyBlock = keyBlockBuffer.slice(start + 8, end);
        } else if (keyBlockType === 1) {
          // lzo compression
          var header = new ArrayBuffer([0xf0, keyWordIdx.decomp_size]);
          keyBlock = _lzo2.default.decompress(_appendBuffer(header, keyBlockBuffer.slice(start + 8, end)));
          keyBlock = (0, _bufferToArraybuffer2.default)(keyBlock).slice(keyBlock.byteOffset, keyBlock.byteOffset + keyBlock.byteLength);
        } else if (keyBlockType === 2) {
          keyBlock = _pako2.default.inflate(keyBlockBuffer.slice(start + 8, end));
        }
        if (keyBlock instanceof Uint8Array) {
          keyBlock = keyBlock.buffer;
        }
        var tempKeyList = this.splitKeyBlock(keyBlock);
        keyList = keyList.concat(tempKeyList);
        // console.log("Scanner.js:601", "tempKeyList", tempKeyList);
        // checksum pass
        // assert(adler32 == zlib.adler32(key_block) & 0xffffffff);

        // console.log("Scanner.js:603", "keyWordIdx.compressed_size", keyWordIdx.comp_size);
        i += keyWordIdx.comp_size;
        // console.log("Scanner.js:604", "i", i);
      }
      // console.log("Scanner.js:609", "KeyList", keyList);
      return keyList;
    }
    /**
     * split all keys from portion key blocks
     * @param {ArrayBuffer} keyBlock the portion key block arrayBuffer
     */

  }, {
    key: "splitKeyBlock",
    value: function splitKeyBlock(keyBlock) {
      var keyList = [];
      var keyStartIndex = 0;
      var keyId = 0;
      var delimiter = new Uint8Array([0x00]);
      var width = 1;
      var dataView = new DataView(keyBlock);

      while (keyStartIndex < keyBlock.byteLength) {
        if (this._v2) {
          // uint64 8bytes
          keyId = dataView.getUint32(keyStartIndex + 4);
          // DEBUG(ln(), keyId);
        } else {
          // uint32 4bytes
          keyId = dataView.getUint32(keyStartIndex);
        }
        if (this.attrs.Encoding == UTF16) {
          delimiter = new Uint8Array([0x00, 0x00]);
          width = 2;
        }
        var i = keyStartIndex + this._number_width;

        var keyEndIndex = 0;
        while (i < keyBlock.byteLength) {
          if (bufferEqual(keyBlock.slice(i, i + width), delimiter)) {
            keyEndIndex = i;
            break;
          }
          i += width;
        }
        var keyText = keyBlock.slice(keyStartIndex + this._number_width, keyEndIndex);

        keyText = this._decoder.decode(keyText);

        keyStartIndex = keyEndIndex + width;
        keyList.push({ offset: keyId, key: keyText });
      }
      return keyList;
    }

    /**
     * read record section
     * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#record-section
    */

  }, {
    key: "readRecordSect",
    value: function readRecordSect() {
      // record section, current offset and 32 bytes section
      // [1] num_blocks  8-bytes, Number items in record_blocks.
      //                 Does not need to equal the number of keyword blocks. Big-endian.
      // [2] num_entries 8-bytes, Total number of records in dictionary.
      //                 Should be equal to keyword_sect.num_entries. Big-endian.
      // [3] index_len   8-bytes, Total size of the comp_size[i] and decomp_size[i] variables.
      //                 In other words, should equal 16 times num_blocks. Big-endian.
      // [4] blocks_len  8-bytes, Total size of the comp_size[i] and decomp_size[i] variables.
      //                 In other words, should equal 16 times num_blocks. Big-endian.
      var mark = this.offset;
      var indexLen = 0;
      var recordSection = {
        // version < 2, readNum uint32
        // version >= 2.0 readNum uint64
        num_blocks: this.readNum(),
        num_entries: this.readNum(),
        index_len: indexLen = this.readNum(),
        blocks_len: this.readNum(),
        // extra field
        record_section_actual_len: this.offset - mark,
        record_block_start_offset: indexLen + this.offset
      };
      return recordSection;
    }
  }, {
    key: "readRecordBlock",
    value: function readRecordBlock(recordSection) {
      // recordBlcokTable
      // record block start current offset, length is recordSection.index_length
      // so input buffer is this.slice(this.offset, this.offset+recordSection.index_length)
      // block size
      var size = recordSection.num_blocks;
      // recordBlcokTable
      this.recordBlockTable = new _RecordBlockTable2.default(size + 1);
      var p0 = recordSection.record_block_start_offset;
      var p1 = 0;
      var recordIndex = new Array(size);
      for (var i = 0, rdx; i < size; i++) {
        recordIndex[i] = {
          comp_size: this.readNum(),
          decomp_size: this.readNum()
        };
        rdx = recordIndex[i];
        this.recordBlockTable.put(p0, p1);
        p0 += rdx.comp_size;
        p1 += rdx.decomp_size;
      }
      this.recordBlockTable.put(p0, p1);
      return this.recordBlockTable;
    }
  }, {
    key: "readDifination",
    value: function readDifination(input, blockInfo, keyWordIndexOffset) {
      var blockBuffer = input.slice(blockInfo.comp_offset, blockInfo.comp_offset + blockInfo.comp_size);
      var decompressedBuffer = this.readBlock(blockBuffer, blockInfo.comp_size, blockInfo.decomp_size);
      var searchOffset = keyWordIndexOffset - blockInfo.decomp_offset;
      if (decompressedBuffer instanceof Uint8Array) {
        decompressedBuffer = decompressedBuffer.buffer;
      }
      var searchDataView = new DataView(decompressedBuffer);
      var len = searchTextLen(searchDataView, searchOffset, this.attrs.Encoding);
      return this._decoder.decode(new Uint8Array(decompressedBuffer, searchOffset, len));
    }
  }]);

  return Scanner;
}();

exports.default = Scanner;