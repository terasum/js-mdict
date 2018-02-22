"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _textEncoding = require("text-encoding");

var _ripemd = require("./ripemd128");

var _ripemd2 = _interopRequireDefault(_ripemd);

var _mdictCommon = require("./mdict-common");

var _mdictCommon2 = _interopRequireDefault(_mdictCommon);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

// A shared UTF16LE text decorder used to read
// the dictionary header string.
const UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
const UTF16 = "UTF-16";

/**
 *
 * @param {*Number offset the file buffer offset needs to read
 * @param {*Number len the bytes length needs to read
 */
function sliceThen(file, offset, len) {
  const p = new Promise((_resolve, reject) => {
    _fs2.default.open(file, (err, fd) => {
      if (err) reject(err);
      const res = Buffer.alloc(len);
      _fs2.default.read(fd, res, 0, offset, (err2, bytesRead, buffer) => {
        if (err2) reject(err2);
        _resolve(buffer);
      });
    });
  });
  /**
   * Call proc with specified arguments prepending with sliced
   * file/blob data (ArrayBuffer) been read.
   * @param {*function the first argument is a function to be executed
   * @param {*rest other optional arguments are passed to the function following
   * auto supplied input ArrayBuffer
   * @return a promise object which can be chained with further process through spread() method
   */
  p.exec = function (proc) {
    for (var _len = arguments.length, argument = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      argument[_key - 1] = arguments[_key];
    }

    const args = argument.slice(0, 1);
    return p.then(data => {
      args.unshift(data);
      const ret = proc.apply(undefined, _toConsumableArray(args));
      return Promise.resolve(ret !== undefined);
    });
  };

  return p;
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
  const key = _ripemd2.default.ripemd128(bkey);
  let byte;
  const keylen = key.length;
  const len = buf.length;
  let prev = 0x36;
  for (let i = 0; i < len; i += 1) {
    byte = buf[i];
    byte = byte >> 4 | byte << 4; // eslint-disable-line no-bitwise
    byte = byte ^ prev ^ i & 0xFF ^ key[i % keylen]; // eslint-disable-line no-bitwise
    prev = buf[i];
    buf[i] = byte; // eslint-disable-line no-param-reassign
  }
  return buf;
}

/**
 * Test if a value of dictionary attribute is true or not.
 */
function isTrue(v) {
  const _v = `${v || false}`.toLowerCase();
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
  const ret = new Uint8Array(len);
  buf.copy(ret, 0, offset, offset + len);
  return ret;
}

class Scanner {
  constructor(file, buf, ext) {
    this.file = file;
    this.ext = ext;
    this.buffer = buf;
    this.offset = 0;

    // dataView instance
    this.dv = new DataView(this.buf);

    /*-----------------------------
     *  configurations (attributes)
     *----------------------------*/
    this.attrs = {}; // diction attributes
    this._v2 = false; // true if engine version >2
    this._bpu = 0x0; // bytes per unit when converting text size to byte length for text data
    this._tail = 0; // need to skip extra tail bytes after decoding text
    this._decoder = null; // text decorder

    this._decryptors = [false, false];
    // [keyword_header_decryptor, keyword_index_decryptor],
    // only keyword_index_decryptor is supported

    // Functions:
    this._searchTextLen = () => {}; // search NUL to get text length

    // read a "short" number representing kewword text size,
    // 8-bit for version < 2, 16-bit for version >= 2
    this._readShort = this.readUint8;

    // Read a number representing offset or data block size,
    // 16-bit for version < 2, 32-bit for version >= 2
    this._readNum = this.readUInt32; //

    // Version >= 2.0 only
    this._checksum_v2 = () => {};
    // adapt key by converting to lower case or stripping punctuations
    // according to dictionary attributes (KeyCaseSensitive, StripKey)
    this._adaptKey = key => key;

    // bind sliceThen() with file argument
    this._slice = sliceThen.bind(null, file);
  }
  /**
   * config the scanner during reading the dictionary file
   * accroding to the header contents, the dictionary
   * attributes can be determined
   */
  config() {
    this.attrs.Encoding = this.attrs.Encoding || UTF16;
    // / searchTextLen need search the 'NUL' character which
    // determined by current encoding
    this._searchTextLen = this.attrs.Encoding === UTF16 ?
    // UTF-16
    () => {
      let ofset = this.offset;
      const mark = this.offset;
      while (this.dv.getUint16(ofset++)) {/* scan  for NUL */}
      return ofset - mark;
    }
    // UTF-8 or GBK or Big5
    : () => {
      let ofset = this.offset;
      const mark = this.offset;
      while (this.dv.getUint8(ofset++)) {/* scan for NUL */}
      return ofset - mark - 1;
    };

    this._decoder = new _textEncoding.TextDecoder(this.attrs.Encoding || UTF16);
    this._bpu = this.attrs.Encoding === UTF16 ? 2 : 1;

    // Version specification configurations
    if (Number.parseInt(this.attrs.GeneratedByEngineVersion, 10) >= 2.0) {
      this._v2 = true;
      this._tail = this._bpu;
      this._readNum = () => {
        this.forward(4);
        return this.readUInt32();
      };
      this.readShort = this.readUInt16;
      this._checksum_v2 = this.checksum;
    } else {
      this._tail = 0;
    }

    // encryption
    if (this.attrs.Encrypted & 0x02) {
      this._decryptors[1] = decrypt;
    }

    const regexp = _mdictCommon2.default.REGEXP_STRIPKEY[this.ext];
    if (isTrue(this.attrs.KeyCaseSensitive)) {
      this._adaptKey = isTrue(this.attrs.StripKey) ? key => key.replace(regexp, "$1") : key => key;
    } else {
      this._adaptKey = isTrue(this.attrs.StripKey || (this._v2 ? "" : "yes")) ? key => {
        key.toLowerCase().repalce(regexp, "$1");
      } : key => key.toLowerCase();
    }
  }

  checksum() {
    // skip checksum
    this.forward(4);
  }

  checksumV2() {
    return this._checksum_v2(this);
  }

  // update offset to new posotion
  forward(len) {
    this.offset += len;
  }

  // return current offset
  offset() {
    return this.offset;
  }

  // 32-bit unsigned int represents header part length
  readUInt32() {
    return conseq(this.dv.getUint32(this.offset, 0), this.forward(4));
  }

  // 16-bit unsigned int
  readUInt16() {
    return conseq(this.dv.getUint16(this.offset, false), this.forward(2));
  }

  // 8-bit unsigned int
  readUint8() {
    return conseq(this.dv.getUint8(this.offset, false), this.forward(1));
  }

  // read a "short" number represents keyword text size,
  // 8-bit for version < 2, 16-bit for version >= 2
  readShort() {
    return this.readUint8();
  }

  // read a number represents offset or data block size,
  // 16-bit for version < 2, 32-bit for version >= 2
  readNum() {
    return this.readUInt32();
  }

  // read the header keys which encoded by utf16le
  readUTF16(len) {
    return conseq(UTF_16LE_DECODER.decode(newUint8Array(this.buffer, this.offset, len)));
  }
}

exports.default = Scanner;