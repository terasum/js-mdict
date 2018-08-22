
import { TextDecoder } from "text-encoding";

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


export default {
  getExtension,
  readUTF16,
  newUint8Array,
  REGEXP_STRIPKEY,
  UTF16,
  levenshtein_distance,
};

