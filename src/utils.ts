import { ripemd128 } from './ripemd128.js';

import { closeSync, openSync, readSync } from 'node:fs';

const REGEXP_STRIPKEY: { [key: string]: RegExp } = {
  mdx: /[().,\-&、 '/\\@_$\!]()/g,
  // mdd:/[!”#$%&'()\\*\\+,-.\\/:;<=>\\?@\\[\\]\^_`{|}~]()/g,
  mdd: /([.][^.]*$)|[()., '/@]/g,
};

const UTF_16LE_DECODER = new TextDecoder('utf-16le');
const UTF16 = 'UTF-16';

/**
 * 从给定的 Buffer 创建一个新的 Uint8Array。
 * @param {Buffer} buf - 源 Buffer。
 * @param {number} offset - 开始偏移量。
 * @param {number} len - 要复制的长度。
 * @returns {Uint8Array} 新创建的 Uint8Array。
 */
function newUint8Array(buf: Buffer, offset: number, len: number): Uint8Array {
  let ret = new Uint8Array(len);
  ret = Buffer.from(buf, offset, offset + len);
  return ret;
}

/**
 * 从 Buffer 中读取 UTF-16 编码的字符串。
 * @param {Buffer} buf - 包含 UTF-16 编码数据的 Buffer。
 * @param {number} offset - 开始读取的偏移量。
 * @param {number} length - 要读取的字节长度。
 * @returns {string} 解码后的 UTF-16 字符串。
 */
function readUTF16(buf: Buffer, offset: number, length: number): string {
  return UTF_16LE_DECODER.decode(newUint8Array(buf, offset, length));
}

/**
 * 获取文件名的扩展名。
 * @param {string} filename - 文件名。
 * @param {string} defaultExt - 默认扩展名,当文件名没有扩展名时使用。
 * @returns {string} 文件的扩展名或默认扩展名。
 */
function getExtension(filename: string, defaultExt: string): string {
  return /(?:\.([^.]+))?$/.exec(filename)?.[1] || defaultExt;
}

/**
 * 返回三个数字中的最小值。
 * @param {number} a - 第一个数字。
 * @param {number} b - 第二个数字。
 * @param {number} c - 第三个数字。
 * @returns {number} 三个数字中的最小值。
 */
function triple_min(a: number, b: number, c: number): number {
  const temp = a < b ? a : b;
  return temp < c ? temp : c;
}

/**
 * 计算两个字符串之间的 Levenshtein 距离。
 * @param {string} a - 第一个字符串。
 * @param {string} b - 第二个字符串。
 * @returns {number} Levenshtein 距离。
 */
function levenshteinDistance(a: string, b: string): number {
  if (!a || a == undefined) {
    return 9999;
  }
  if (!b || b == undefined) {
    return 9999;
  }
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () =>
    new Array(n + 1).fill(0)
  );

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (a[i - 1] !== b[j - 1]) {
        dp[i][j] = triple_min(
          1 + dp[i - 1][j],
          1 + dp[i][j - 1],
          1 + dp[i - 1][j - 1]
        );
      } else {
        dp[i][j] = dp[i - 1][j - 1];
      }
    }
  }
  return dp[m][n];
}

/**
 * 解析 XML 格式的头部文本,提取属性。
 * @param {string} header_text - XML 格式的头部文本。
 * @returns {Object} 包含提取的属性的对象。
 */
function parseHeader(header_text: string): {
  [key: string]: string | { [key: string]: string[] };
} {
  const headerAttr: { [key: string]: string | { [key: string]: string[] } } =
    {};
  Array.from(header_text.matchAll(/(\w+)="((.|\r|\n)*?)"/g)).forEach((tag) => {
    headerAttr[tag[1]] = unescapeEntities(tag[2]);
  });
  // stylesheet attribute if present takes form of:
  //   style_number # 1-255
  //   style_begin  # or ''
  //   style_end    # or ''
  // store stylesheet in dict in the form of
  // {'number' : ('style_begin', 'style_end')}
  if (headerAttr['StyleSheet'] && typeof headerAttr['StyleSheet'] == 'string') {
    const styleSheet: { [key: string]: string[] } = {};
    const lines = headerAttr['StyleSheet'].split(/[\r\n]+/g);
    for (let i = 0; i < lines.length; i += 3) {
      styleSheet[lines[i]] = [lines[i + 1], lines[i + 2]];
    }

    headerAttr['StyleSheet'] = styleSheet;
  }
  return headerAttr;
}

/**
 * 将 Uint8Array 转换为无符号 8 位整数。
 * @param {Uint8Array} bytes - 包含一个字节的 Uint8Array。
 * @returns {number} 转换后的无符号 8 位整数。
 */
function uint8BEtoNumber(bytes: Uint8Array): number {
  return bytes[0] & 0xff;
}

/**
 * 将 Uint8Array 转换为无符号 16 位整数(大端序)。
 * @param {Uint8Array} bytes - 包含两个字节的 Uint8Array。
 * @returns {number} 转换后的无符号 16 位整数。
 */
function uint16BEtoNumber(bytes: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < 1; i++) {
    n |= bytes[i];
    n <<= 8;
  }
  n |= bytes[1];
  return n;
}

/**
 * 将 Uint8Array 转换为无符号 32 位整数(大端序)。
 * @param {Uint8Array} bytes - 包含四个字节的 Uint8Array。
 * @returns {number} 转换后的无符号 32 位整数。
 */
function uint32BEtoNumber(bytes: Uint8Array): number {
  let n = 0;
  for (let i = 0; i < 3; i++) {
    n |= bytes[i];
    n <<= 8;
  }
  n |= bytes[3];
  return n;
}

/**
 * 将 Uint8Array 转换为无符号 64 位整数(大端序)。
 * @param {Uint8Array} bytes - 包含八个字节的 Uint8Array。
 * @returns {number} 转换后的无符号 64 位整数。
 * @throws {Error} 如果数值超过 JavaScript 的安全整数范围。
 */
function uint64BEtoNumber(bytes: Uint8Array): number {
  if (bytes[1] >= 0x20 || bytes[0] > 0) {
    throw new Error('Error: uint64 larger than 2^53, JS may lost accuracy');
  }
  let high = 0;
  for (let i = 0; i < 3; i++) {
    high |= bytes[i] & 0xff;
    high <<= 8;
  }
  high |= bytes[3] & 0xff;
  high = (high & 0x001fffff) * 0x100000000;
  high += bytes[4] * 0x1000000;
  high += bytes[5] * 0x10000;
  high += bytes[6] * 0x100;
  high += bytes[7] & 0xff;

  return high;
}

const NUMFMT_UINT8 = Symbol('NUM_FMT_UINT8');
const NUMFMT_UINT16 = Symbol('NUM_FMT_UINT16');
const NUMFMT_UINT32 = Symbol('NUM_FMT_UINT32');
const NUMFMT_UINT64 = Symbol('NUM_FMT_UINT64');

export type NumFmt =
  | typeof NUMFMT_UINT8
  | typeof NUMFMT_UINT16
  | typeof NUMFMT_UINT32
  | typeof NUMFMT_UINT64;

/**
 * 从 Buffer 中读取指定格式的数字。
 * @param {Buffer} bf - 要读取的 BufferList。
 * @param {Symbol} numfmt - 数字格式(NUMFMT_UINT8, NUMFMT_UINT16, NUMFMT_UINT32, NUMFMT_UINT64)。
 * @returns {number} 读取的数字。
 */
function readNumber(bf: Buffer, numfmt: NumFmt): number {
  const value = new Uint8Array(bf);
  if (numfmt === NUMFMT_UINT32) {
    return uint32BEtoNumber(value);
  } else if (numfmt === NUMFMT_UINT64) {
    return uint64BEtoNumber(value);
  } else if (numfmt === NUMFMT_UINT16) {
    return uint16BEtoNumber(value);
  } else if (numfmt === NUMFMT_UINT8) {
    return uint8BEtoNumber(value);
  }
  return 0;
}

/**
 * 从 BufferList 的指定偏移量读取指定格式的数字。
 * @param {BufferList} bf - 要读取的 BufferList。
 * @param {number} offset - 开始读取的偏移量。
 * @param {Symbol} numfmt - 数字格式(NUMFMT_UINT8, NUMFMT_UINT16, NUMFMT_UINT32, NUMFMT_UINT64)。
 * @returns {number} 读取的数字。
 */
// function readNumber2(bf: Buffer, offset: number, numfmt: symbol): number {
//   if (numfmt === NUMFMT_UINT32) {
//     return bf.readUInt32BE(offset);
//   } else if (numfmt === NUMFMT_UINT64) {
//     return uint64BEtoNumber(bf.slice(offset, offset + 8));
//   } else if (numfmt === NUMFMT_UINT16) {
//     return bf.readUInt16BE(offset);
//   } else if (numfmt === NUMFMT_UINT8) {
//     return bf.readUInt8(offset);
//   }
//   return 0;
// }


function b2n(data: Uint8Array): number {
  switch (data.length) {
    case 1:
      return uint8BEtoNumber(data);
    case 2:
      return uint16BEtoNumber(data);
    case 4:
      return uint32BEtoNumber(data);
    case 8:
      return uint64BEtoNumber(data);
  }
  return 0;
}

/**
 * 使用简单的加密算法快速解密数据。
 * @param {Uint8Array} b - 要解密的数据。
 * @param {Uint8Array} key - 解密密钥。
 * @returns {Uint8Array} 解密后的数据。
 */
function fast_decrypt(b: Uint8Array, key: Uint8Array): Uint8Array {
  // XOR decryption
  let previous = 0x36;
  for (let i = 0; i < b.length; ++i) {
    let t = ((b[i] >> 4) | (b[i] << 4)) & 0xff;
    t = t ^ previous ^ (i & 0xff) ^ key[i % key.length];
    previous = b[i];
    b[i] = t;
  }
  return b;
}

function salsa_decrypt(data: Buffer, k: Buffer): Buffer {
  // salsa20 (8 rounds) decryption
  // TODO
  // s20 = Salsa20(key=encrypt_key, IV=b"\x00"*8, rounds=8)
  // return s20.encryptBytes(ciphertext)
  return data;
}


/**
 * 解密 MDX 格式的压缩块。
 * @param {Buffer} comp_block - 压缩的 MDX 块。
 * @returns {BufferList} 解密后的数据。
 */
function mdxDecrypt(comp_block: Uint8Array): Uint8Array {
  const keyinBuffer = new Uint8Array(8);
  keyinBuffer.set(comp_block.slice(4, 8), 0);
  keyinBuffer[4] ^= 0x95;
  keyinBuffer[5] ^= 0x36;
  keyinBuffer[6] ^= 0x00;
  keyinBuffer[7] ^= 0x00;

  const key = ripemd128(keyinBuffer);
  const resultBuff = Buffer.concat([
    comp_block.subarray(0, 8),
    fast_decrypt(comp_block.slice(8), Uint8Array.from(key)),
  ]);
  return resultBuff;
}

/**
 * 将两个 ArrayBuffer 连接成一个新的 ArrayBuffer。
 * @param {ArrayBuffer} buffer1 - 第一个 ArrayBuffer。
 * @param {ArrayBuffer} buffer2 - 第二个 ArrayBuffer。
 * @returns {ArrayBuffer} 连接后的新 ArrayBuffer。
 */
function appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer): Buffer {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return Buffer.from(tmp.buffer);
}

/**
 * 检查给定的字符串是否表示真值。
 * @param {string | undefined} v - 要检查的字符串。
 * @returns {boolean} 如果字符串表示真值则返回 true,否则返回 false。
 */
function isTrue(v: string | undefined): boolean {
  if (!v) return false;
  v = v.toLowerCase();
  return v === 'yes' || v === 'true';
}

function caseUnsensitiveCompare(a: string, b: string): number {
  return a.toLowerCase().localeCompare(b.toLowerCase());
}

function caseSensitiveCompare(a: string, b: string): number {
  return a.localeCompare(b);
}

export function readChunkSync(filePath: string, start: number, length: number) {
  let buffer = new Uint8Array(length);
  const fileDescriptor = openSync(filePath, 'r');

  try {
    const bytesRead = readSync(fileDescriptor, buffer, {
      length,
      position: start,
    });

    if (bytesRead < length) {
      buffer = buffer.subarray(0, bytesRead);
    }

    return buffer;
  } finally {
    closeSync(fileDescriptor);
  }
}

function wordCompare(word1: string, word2: string) {
  if (!word1 || !word2) {
    throw new Error(`invalid word comparation ${word1} and ${word2}`);
  }
  // if the two words are indentical, return 0 directly
  if (word1 === word2) {
    return 0;
  }
  const len = word1.length > word2.length ? word2.length : word1.length;
  for (let i = 0; i < len; i++) {
    const w1 = word1[i];
    const w2 = word2[i];
    if (w1 == w2) {
      continue;
      // case1: w1: `H` w2: `h` or `h` and `H`continue
    } else if (w1.toLowerCase() == w2.toLowerCase()) {
      continue;
      // case3: w1: `H` w2: `k`, h < k return -1
    } else if (w1.toLowerCase() < w2.toLowerCase()) {
      return -1;
      // case4: w1: `H` w2: `a`, h > a return 1
    } else if (w1.toLowerCase() > w2.toLowerCase()) {
      return 1;
    }
  }
  // case5: `Hello` and `Hellocat`
  return word1.length < word2.length ? -1 : 1;
}

// if this.header.KeyCaseSensitive = YES,
// Uppercase character is placed in the start position of the directionary
// so if `this.header.KeyCaseSensitive = YES` use normalUpperCaseWordCompare, else use wordCompare
function normalUpperCaseWordCompare(word1: string, word2: string) {
  if (word1 === word2) {
    return 0;
  } else if (word1 > word2) {
    return 1;
  } else {
    return -1;
  }
}

function unescapeEntities(text: string) {
  text = text.replace(/&lt;/g, '<');
  text = text.replace(/&gt;/g, '>');
  text = text.replace(/&quot;/g, '"');
  text = text.replace(/&amp;/g, '&');

  return text;
}

function substituteStylesheet(
  styleSheet: { [key: string]: string[] },
  txt: string
) {
  const txtTag = Array.from(txt.matchAll(/`(\d+)`/g));
  const txtList = Array.from(txt.split(/`\d+`/g)).slice(1);
  let styledTxt = '';
  for (let i = 0; i < txtList.length; i++) {
    const style = styleSheet[txtTag[i][1]];
    styledTxt += style[0] + txtList[i] + style[1];
  }
  return styledTxt;
}

export default {
  getExtension,
  readUTF16,
  newUint8Array,
  levenshteinDistance,
  parseHeader,
  readNumber,
  b2n,
  mdxDecrypt,
  ripemd128,
  fast_decrypt,
  salsa_decrypt,
  appendBuffer,
  isTrue,
  caseUnsensitiveCompare,
  caseSensitiveCompare,
  normalUpperCaseWordCompare,
  wordCompare,
  readChunkSync,
  unescapeEntities,
  substituteStylesheet,
  UTF16,
  REGEXP_STRIPKEY,
  NUMFMT_UINT8,
  NUMFMT_UINT16,
  NUMFMT_UINT32,
  NUMFMT_UINT64,
};
