"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _textEncoding = require("text-encoding");

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

exports.default = {
  getExtension: getExtension,
  readUTF16: readUTF16,
  newUint8Array: newUint8Array,
  REGEXP_STRIPKEY: REGEXP_STRIPKEY,
  UTF16: UTF16,
  levenshtein_distance: levenshtein_distance
};