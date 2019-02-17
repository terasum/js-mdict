"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _textEncoding = require("text-encoding");

var _xmldom = require("xmldom");

var _bl = require("bl");

var _bl2 = _interopRequireDefault(_bl);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var REGEXP_STRIPKEY = {
  mdx: /[()., '/\\@_-]()/g,
  mdd: /([.][^.]*$)|[()., '/\\@_-]/g // strip '.' before file extension that is keeping the last period
};

var UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
var UTF16 = "UTF-16";

function newUint8Array(buf, offset, len) {
  var ret = new Uint8Array(len);
  ret = Buffer.from(buf, offset, offset + len);
  return ret;
}

function readUTF16(buf, offset, length) {
  return UTF_16LE_DECODER.decode(newUint8Array(buf, offset, length));
}

function getExtension(filename, defaultExt) {
  return (/(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt
  );
}

// tool function for levenshtein disttance
function triple_min(a, b, c) {
  var temp = a < b ? a : b;
  return temp < c ? temp : c;
}

// Damerau–Levenshtein distance  implemention
// ref: https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
function levenshtein_distance(a, b) {
  // create a 2 dimensions array
  var m = a.length;
  var n = b.length;
  var dp = new Array(m + 1);
  for (var i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
  }

  // init dp array
  for (var _i = 0; _i <= m; _i++) {
    dp[_i][0] = _i;
  }
  for (var j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // dynamic approach
  for (var _i2 = 1; _i2 <= m; _i2++) {
    for (var _j = 1; _j <= n; _j++) {
      if (a[_i2 - 1] !== b[_j - 1]) {
        dp[_i2][_j] = triple_min(1 + dp[_i2 - 1][_j], // deletion
        1 + dp[_i2][_j - 1], // insertion
        1 + dp[_i2 - 1][_j - 1] // replacement
        );
      } else {
        dp[_i2][_j] = dp[_i2 - 1][_j - 1];
      }
    }
  }
  return dp[m][n];
}

/**
 * parse mdd/mdx header section
 * @param {string} header_text
 */
function parseHeader(header_text) {
  var doc = new _xmldom.DOMParser().parseFromString(header_text, "text/xml");
  var header_attr = {};
  var elem = doc.getElementsByTagName("Dictionary")[0];
  if (!elem) {
    elem = doc.getElementsByTagName("Library_Data")[0]; // eslint_disable_prefer_destructing
  }
  for (var i = 0, item; i < elem.attributes.length; i++) {
    item = elem.attributes[i];
    header_attr[item.nodeName] = item.nodeValue;
  }
  return header_attr;
}

function uint32BEtoNumber(bytes) {
  var n = 0;
  for (var i = 0; i < 3; i++) {
    n |= bytes[i];
    n <<= 8;
  }
  n |= bytes[3];
  return n;
}

function uint64BEtoNumber(bytes) {
  var n = 0;
  for (var i = 0; i < 7; i++) {
    n |= bytes[i];
    n <<= 8;
  }
  n |= bytes[7];
  return n;
}

/**
 * read number from buffer
 * @param {BufferList} bf number buffer
 * @param {string} numfmt number format
 */
function readNumber(bf, numfmt) {
  var value = new Uint8Array(bf);
  if (numfmt === ">I") {
    // int32
    return uint32BEtoNumber(bf);
  } else if (numfmt === ">Q") {
    // int64
    return uint64BEtoNumber(value);
  }
  throw new Error("not support number format");

  // return struct.unpack(this._number_format, bf)[0];
}

exports.default = {
  getExtension: getExtension,
  readUTF16: readUTF16,
  newUint8Array: newUint8Array,
  REGEXP_STRIPKEY: REGEXP_STRIPKEY,
  UTF16: UTF16,
  levenshtein_distance: levenshtein_distance,
  parseHeader: parseHeader,
  readNumber: readNumber
};