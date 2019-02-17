
import { TextDecoder } from "text-encoding";
import { DOMParser } from "xmldom";
import BufferList from "bl";
import Long from "long";

const REGEXP_STRIPKEY = {
  mdx: /[()., '/\\@_-]()/g,
  mdd: /([.][^.]*$)|[()., '/\\@_-]/g, // strip '.' before file extension that is keeping the last period
};

const UTF_16LE_DECODER = new TextDecoder("utf-16le");
const UTF16 = "UTF-16";


function newUint8Array(buf, offset, len) {
  let ret = new Uint8Array(len);
  ret = Buffer.from(buf, offset, offset + len);
  return ret;
}


function readUTF16(buf, offset, length) {
  return UTF_16LE_DECODER.decode(newUint8Array(buf, offset, length));
}


function getExtension(filename, defaultExt) {
  return /(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt;
}

// tool function for levenshtein disttance
function triple_min(a, b, c) {
  const temp = a < b ? a : b;
  return temp < c ? temp : c;
}

// Damerau–Levenshtein distance  implemention
// ref: https://en.wikipedia.org/wiki/Damerau%E2%80%93Levenshtein_distance
function levenshtein_distance(a, b) {
  // create a 2 dimensions array
  const m = a.length;
  const n = b.length;
  const dp = new Array(m + 1);
  for (let i = 0; i <= m; i++) {
    dp[i] = new Array(n + 1);
  }

  // init dp array
  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  // dynamic approach
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] !== b[j - 1]) {
        dp[i][j] = triple_min(
          1 + dp[i - 1][j], // deletion
          1 + dp[i][j - 1], // insertion
          1 + dp[i - 1][j - 1], // replacement
        );
      } else {
        dp[i][j] = dp[i - 1][j - 1];
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
  const doc = new DOMParser().parseFromString(header_text, "text/xml");
  const header_attr = {};
  let elem = doc.getElementsByTagName("Dictionary")[0];
  if (!elem) {
    elem = doc.getElementsByTagName("Library_Data")[0]; // eslint_disable_prefer_destructing
  }
  for (let i = 0, item; i < elem.attributes.length; i++) {
    item = elem.attributes[i];
    header_attr[item.nodeName] = item.nodeValue;
  }
  return header_attr;
}

function uint32BEtoNumber(bytes) {
  let n = 0;
  for (let i = 0; i < 3; i++) {
    n |= bytes[i] & 0xff;
    n <<= 8;
  }
  n |= bytes[3] & 0xff;
  return n;
}

function uint64BEtoNumber(bytes) {
  if (bytes[1] >= 0x20 || bytes[0] > 0) {
    throw new Error("uint64 larger than 2^53, JS may lost accuracy");
  }
  let high = 0;
  for (let i = 0; i < 3; i++) {
    high |= bytes[i] & 0xff;
    high <<= 8;
  }
  high |= bytes[3] & 0xff;
  // ignore > 2^53
  high = (high & 0x001FFFFF) * 0x100000000;
  high += bytes[4] * 0x1000000;
  high += bytes[5] * 0x10000;
  high += bytes[6] * 0x100;
  high += bytes[7] & 0xFF;

  return high;
}


const NUMFMT_UINT32 = Symbol("NUM_FMT_UINT32");
const NUMFMT_UINT64 = Symbol("NUM_FMT_UINT64");
/**
 * read number from buffer
 * @param {BufferList} bf number buffer
 * @param {string} numfmt number format
 */
function readNumber(bf, numfmt) {
  const value = new Uint8Array(bf);
  if (numfmt === NUMFMT_UINT32) {
    // int32
    return uint32BEtoNumber(bf);
  } else if (numfmt === NUMFMT_UINT64) {
    // int64
    return uint64BEtoNumber(value);
  }

  // return struct.unpack(this._number_format, bf)[0];
}


export default {
  getExtension,
  readUTF16,
  newUint8Array,
  REGEXP_STRIPKEY,
  UTF16,
  levenshtein_distance,
  parseHeader,
  readNumber,
  NUMFMT_UINT32,
  NUMFMT_UINT64,
};

