import { ripemd128 } from './ripemd128.js';
/**
 * 从给定的 Buffer 创建一个新的 Uint8Array。
 * @param {Buffer} buf - 源 Buffer。
 * @param {number} offset - 开始偏移量。
 * @param {number} len - 要复制的长度。
 * @returns {Uint8Array} 新创建的 Uint8Array。
 */
declare function newUint8Array(buf: Buffer, offset: number, len: number): Uint8Array;
/**
 * 从 Buffer 中读取 UTF-16 编码的字符串。
 * @param {Buffer} buf - 包含 UTF-16 编码数据的 Buffer。
 * @param {number} offset - 开始读取的偏移量。
 * @param {number} length - 要读取的字节长度。
 * @returns {string} 解码后的 UTF-16 字符串。
 */
declare function readUTF16(buf: Buffer, offset: number, length: number): string;
/**
 * 获取文件名的扩展名。
 * @param {string} filename - 文件名。
 * @param {string} defaultExt - 默认扩展名,当文件名没有扩展名时使用。
 * @returns {string} 文件的扩展名或默认扩展名。
 */
declare function getExtension(filename: string, defaultExt: string): string;
/**
 * 计算两个字符串之间的 Levenshtein 距离。
 * @param {string} a - 第一个字符串。
 * @param {string} b - 第二个字符串。
 * @returns {number} Levenshtein 距离。
 */
declare function levenshteinDistance(a: string, b: string): number;
/**
 * 解析 XML 格式的头部文本,提取属性。
 * @param {string} header_text - XML 格式的头部文本。
 * @returns {Object} 包含提取的属性的对象。
 */
declare function parseHeader(header_text: string): {
    [key: string]: string | {
        [key: string]: string[];
    };
};
declare const NUMFMT_UINT8: unique symbol;
declare const NUMFMT_UINT16: unique symbol;
declare const NUMFMT_UINT32: unique symbol;
declare const NUMFMT_UINT64: unique symbol;
export type NumFmt = typeof NUMFMT_UINT8 | typeof NUMFMT_UINT16 | typeof NUMFMT_UINT32 | typeof NUMFMT_UINT64;
/**
 * 从 Buffer 中读取指定格式的数字。
 * @param {Buffer} bf - 要读取的 BufferList。
 * @param {Symbol} numfmt - 数字格式(NUMFMT_UINT8, NUMFMT_UINT16, NUMFMT_UINT32, NUMFMT_UINT64)。
 * @returns {number} 读取的数字。
 */
declare function readNumber(bf: Buffer, numfmt: NumFmt): number;
/**
 * 从 BufferList 的指定偏移量读取指定格式的数字。
 * @param {BufferList} bf - 要读取的 BufferList。
 * @param {number} offset - 开始读取的偏移量。
 * @param {Symbol} numfmt - 数字格式(NUMFMT_UINT8, NUMFMT_UINT16, NUMFMT_UINT32, NUMFMT_UINT64)。
 * @returns {number} 读取的数字。
 */
declare function b2n(data: Uint8Array): number;
/**
 * 使用简单的加密算法快速解密数据。
 * @param {Uint8Array} b - 要解密的数据。
 * @param {Uint8Array} key - 解密密钥。
 * @returns {Uint8Array} 解密后的数据。
 */
declare function fast_decrypt(b: Uint8Array, key: Uint8Array): Uint8Array;
declare function salsa_decrypt(data: Buffer, k: Buffer): Buffer;
/**
 * 解密 MDX 格式的压缩块。
 * @param {Buffer} comp_block - 压缩的 MDX 块。
 * @returns {BufferList} 解密后的数据。
 */
declare function mdxDecrypt(comp_block: Uint8Array): Uint8Array;
/**
 * 将两个 ArrayBuffer 连接成一个新的 ArrayBuffer。
 * @param {ArrayBuffer} buffer1 - 第一个 ArrayBuffer。
 * @param {ArrayBuffer} buffer2 - 第二个 ArrayBuffer。
 * @returns {ArrayBuffer} 连接后的新 ArrayBuffer。
 */
declare function appendBuffer(buffer1: ArrayBuffer, buffer2: ArrayBuffer): Buffer;
/**
 * 检查给定的字符串是否表示真值。
 * @param {string | undefined} v - 要检查的字符串。
 * @returns {boolean} 如果字符串表示真值则返回 true,否则返回 false。
 */
declare function isTrue(v: string | undefined): boolean;
declare function wordCompare(word1: string, word2: string): 0 | 1 | -1;
declare function substituteStylesheet(styleSheet: {
    [key: string]: string[];
}, txt: string): string;
declare const _default: {
    getExtension: typeof getExtension;
    readUTF16: typeof readUTF16;
    newUint8Array: typeof newUint8Array;
    levenshteinDistance: typeof levenshteinDistance;
    parseHeader: typeof parseHeader;
    readNumber: typeof readNumber;
    b2n: typeof b2n;
    mdxDecrypt: typeof mdxDecrypt;
    ripemd128: typeof ripemd128;
    fast_decrypt: typeof fast_decrypt;
    salsa_decrypt: typeof salsa_decrypt;
    appendBuffer: typeof appendBuffer;
    isTrue: typeof isTrue;
    wordCompare: typeof wordCompare;
    substituteStylesheet: typeof substituteStylesheet;
    UTF16: string;
    REGEXP_STRIPKEY: {
        [key: string]: RegExp;
    };
    NUMFMT_UINT8: symbol;
    NUMFMT_UINT16: symbol;
    NUMFMT_UINT32: symbol;
    NUMFMT_UINT64: symbol;
};
export default _default;
