// import fs from "fs";
import pako from "pako";
import { TextDecoder } from "text-encoding";
import bufferToArrayBuffer from "buffer-to-arraybuffer";
// below is for debug
// import arrayBufferToBuffer from "arraybuffer-to-buffer";
import { DOMParser } from "xmldom";
import ripemd128 from "./ripemd128";
import lzo from "./lzo";
import common from "./mdict-common";
import RecordBlockTable from "./RecordBlockTable";

// A shared UTF16LE text decorder used to read
// the dictionary header string.
const UTF_16LE_DECODER = new TextDecoder("utf-16le");
const UTF16 = "UTF-16";

/**
 * Creates a new Uint8Array based on two different ArrayBuffers
 *
 * @private
 * @param {ArrayBuffers} buffer1 The first buffer.
 * @param {ArrayBuffers} buffer2 The second buffer.
 * @return {ArrayBuffers} The new ArrayBuffer created out of the two.
 */
const _appendBuffer = function (buffer1, buffer2) {
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
};

function bufferEqual(buf1, buf2) {
  if (buf1.byteLength != buf2.byteLength) return false;
  const dv1 = new Int8Array(buf1);
  const dv2 = new Int8Array(buf2);
  for (let i = 0; i != buf1.byteLength; i++) {
    if (dv1[i] != dv2[i]) return false;
  }
  return true;
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
  const key = ripemd128.ripemd128(bkey);
  let byte;
  const keylen = key.length;
  const len = buf.length;
  let prev = 0x36;
  for (let i = 0; i < len; i += 1) {
    byte = buf[i];
    byte = ((byte >> 4) | (byte << 4)); // eslint-disable-line no-bitwise
    byte = byte ^ prev ^ (i & 0xFF) ^ key[i % keylen]; // eslint-disable-line no-bitwise
    prev = buf[i];
    buf[i] = byte; // eslint-disable-line no-param-reassign
  }
  return buf;
}

/**
 * Test if a value of dictionary attribute is true or not.
 */
function isTrue(v) {
  const _v = (`${v || false}`).toLowerCase();
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
function conseq(...args) {
  return args[0];
}

function newUint8Array(buf, offset, len) {
  let ret = new Uint8Array(len);
  ret = Buffer.from(buf, offset, offset + len);
  return ret;
}


class Scanner {
  constructor(buf, ext) {
    this.ext = ext;
    this.buffer = buf instanceof Buffer ? bufferToArrayBuffer(buf) : buf;
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
    this._searchTextLen = (this.attrs.Encoding === UTF16)
      // UTF-16
      ? () => {
        let ofset = this.offset;
        const mark = this.offset;
        while (this.dv.getUint16(ofset++)) { /* scan  for NUL */ }
        return ofset - mark;
      }
      // UTF-8 or GBK or Big5
      : () => {
        let ofset = this.offset;
        const mark = this.offset;
        while (this.dv.getUint8(ofset++)) { /* scan for NUL */ }
        return ofset - mark - 1;
      };

    this._decoder = new TextDecoder(this.attrs.Encoding || UTF16);
    this._bpu = this.attrs.Encoding === UTF16 ? 2 : 1;

    // Version specification configurations
    if (Number.parseInt(this.attrs.GeneratedByEngineVersion, 10) >= 2.0) {
      this._v2 = true;
      this._tail = this._bpu;
      this._number_format = "uint64";
      this._number_width = 8;
      this._readNum = () => {
        this.forward(4);
        return this.readUInt32();
      };
      this.readShort = this.readUInt16;
    } else {
      this._tail = 0;
    }

    // encryption
    if (this.attrs.Encrypted & 0x02) {
      this._decryptors[1] = decrypt;
    }

    const regexp = common.REGEXP_STRIPKEY[this.ext];
    if (isTrue(this.attrs.KeyCaseSensitive)) {
      this._adaptKey = isTrue(this.attrs.StripKey)
        ? key => key.replace(regexp, "$1")
        : key => key;
    } else {
      this._adaptKey = isTrue(this.attrs.StripKey || (this._v2 ? "" : "yes"))
        ? key => key.toLowerCase().replace(regexp, "$1")
        : key => key.toLowerCase();
    }
  }

  /**
  *
  * @param {*Number offset the file buffer offset needs to read
  * @param {*Number len the bytes length needs to read
  */
  slice(offset, len) {
    return bufferToArrayBuffer(Buffer.from(this.buffer, offset, len));
  }

  checksum() {
    return this.readUInt32();
  }

  checksumV2() {
    return this.checksum();
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

  // Read data to an Uint8Array and decode it to text with specified encoding.
  // @param len length in basic unit, need to multiply byte per unit to get length in bytes
  // NOTE: After decoding the text, it is need to forward extra "tail" bytes
  // according to specified encoding.
  readTextSized(len) {
    const length = len * this._bpu;
    const read = conseq(this._decoder.decode(newUint8Array(
      this.buffer,
      this.offset, length,
    )), this.forward(length + this._tail));
    return read;
  }
  readBlock(length, expectedBufSize, decryptor) {
    // this getUint8 will not go forward
    // first byte means compress type
    // compression type, 0 = non, 1 = lzo, 2 = gzip;

    const compType = this.dv.getUint8(this.offset, false);


    if (compType === 0) {
      if (this._v2) {
        // ENHANCEMENT
        if (this.attrs.Encrypted === 0x02) {
          // TODO: decrypted
          console.log(" TODO: NEED TO DECRYPTED");
        }
        // for version >= 2, skip comp_type (4 bytes with tailing \x00) and checksum (4 bytes)
        // for version >=2 commpressed is important
        // key_block_info = zlib.decompress(this.slice(this.offset,this.))
        this.forward(8);
      }
      return this;
    }
    // skip comp_type (4 bytes with tailing \x00) and checksum (4 bytes)
    // IMPORTANT, version <2, also needs to forward?
    this.forward(8);
    // this.offset += 8;
    const len = length - 8;
    let temp = Buffer.from(this.buffer, 0, this.offset - 4, this.offset);
    if (decryptor) {
      const passkey = new Uint8Array(8);
      this.buffer.copy(passkey, 0, this.offset - 4, this.offset);
      passkey.set([0x95, 0x36, 0x00, 0x00], 4);
      temp = decryptor(temp, passkey);
    }

    temp = compType === 2 ? pako.inflate(temp) : lzo.decompress(temp, expectedBufSize, 1308672);
    this.forward(len);
    const d = Buffer.from(temp);
    return new Scanner(d, temp.length);
  }
  /**
   * Read data block of keyword index, key block or record content.
   * These data block are maybe in compressed (gzip or lzo) format,
   * while keyword index maybe be encrypted.
   * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#compression (with typo mistake)
   * @param {Number} keyIndexCompLen means buffer length
   * @param {Number} keyIndexDecompLen if compressed expectedBufSize is the deComp_size
   * @param {Function} decryptor is a decrypt function
   */
  // length       keywordSummary.keyIndexCompLen,
  // expectedBufSize    keywordSummary.keyIndexDecompLen,
  // readKeyBlock2(keyIndexCompLen, keyIndexDecompLen, decryptor) {
  //   // compressed key block info
  //   let keyBlockInfoCompressed = this.slice(this.offset, keyIndexCompLen);
  //   const kbcdv = new DataView(keyBlockInfoCompressed);
  //   const compType2 = kbcdv.getUint8(0);
  //   let keyBlockInfo = null;
  //   if (this._v2) {
  //     // zlib compression
  //     if (compType2 !== 2) {
  //       throw new Error("version > 2, not gzip compression");
  //     }
  //     console.debug("compress type is gzip");
  //     if (this.attrs.Encrypted === 0x02) {
  //       // decrypt
  //       // const passkey = new Uint8Array(8);
  //       // this.buffer.copy(passkey, 0, this.offset - 4, this.offset);
  //       // passkey.set([0x95, 0x36, 0x00, 0x00], 4);
  //       // temp = decryptor(temp, passkey);
  //       keyBlockInfoCompressed = decryptor(keyBlockInfoCompressed);
  //     }
  //     // decompress
  //     keyBlockInfo = pako.inflate(keyBlockInfoCompressed.slice(8));
  //     // adler checksum  Big-Endian
  //     // TODO: because of pako zlib implements,
  //     //       we do not have some alder32 checksum
  //     //       get methods.
  //     // adler32 = kbcdv.getUint32(4);
  //     // if (adler32 !== pako.adler32(keyBlockInfo) {
  //     // throw new Error("key block checksum not correct")
  //     // }
  //   } else if (compType2 === 1) {
  //     console.debug("compress type is lzo");
  //     keyBlockInfo = lzo.decompress(keyBlockInfoCompressed, keyIndexDecompLen, 1308672);
  //   } else {
  //     console.debug("compress type is none");
  //     keyBlockInfo = keyBlockInfoCompressed;
  //   }
  //   /** ***********************************
  //    * starts to decode the keyBlockInfo *
  //    ************************************ */
  //   // new keyBlockInfo data view
  //   // const kbdv = new DataView(keyBlockInfo);
  //   const keywordIndex = Array(keywordSummary.numBlocks);
  //   let offset = 0;

  //   for (let i = 0, size; i < keywordSummary.numBlocks; i++) {
  //     keywordIndex[i] = {
  //       num_entries: conseq(blockScanner.readNum()),
  //       // UNUSED, can be ignored
  //       first_size: blockScanner.readShort(),
  //       first_word: conseq(blockScanner.readTextSized(size)),
  //       // UNUSED, can be ignored
  //       last_size: blockScanner.readShort(),
  //       last_word: blockScanner.readTextSized(size),
  //       comp_size: size = blockScanner.readNum(),
  //       decomp_size: blockScanner.readNum(),
  //       // extra fields
  //       offset, // offset of the first byte for the target key block in mdx/mdd file
  //       index: i, // index of this key index, used to search previous/next block
  //     };
  //     offset += size;
  //   }
  //   return new Scanner(keyBlockInfo, this.ext);
  // }

  /**
   * Read the first 4 bytes of mdx/mdd file to get length of header_str.
   * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#file-structure
   * input sliced file (start = 0, length = 4)
   * @return length of header_str
   */
  readFileHeaderSize() {
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
  readHeaderSect(len) {
    const headerStr = this.readUTF16(len).replace(/\0$/, ""); // need to remove tailing NUL
    // parse dictionary attributes
    const doc = new DOMParser().parseFromString(headerStr, "text/xml");
    let elem = doc.getElementsByTagName("Dictionary")[0];
    if (!elem) {
      elem = doc.getElementsByTagName("Library_Data")[0]; // eslint_disable_prefer_destructing
    }
    // console.log(doc.getElementsByTagName("Dictionary")[0].attributes);

    // var xml = parseXml(header_str).querySelector('Dictionary, Library_Data').attributes;

    for (let i = 0, item; i < elem.attributes.length; i++) {
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

  readKeywordSummary(ofst /* header_remain_len */) {
    const mark = this.offset + ofst; /* header_remain_len */
    // 2504
    this.forward(ofst);
    // offset = 2504
    const ret = {
      numBlocks: this.readNum(),
      numEntries: this.readNum(),
      keyIndexDeCompLen: this._v2 && this.readNum(), // Ver >= 2.0 only
      keyIndexCompLen: this.readNum(),
      keyBlockLen: this.readNum(),
      // forward (4)
      checksum: 0,
      len: this.offset - mark,
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
  readKeywordIndex(keywordSummary) {
    // const blockScanner = this.readBlock(
    //   keywordSummary.keyIndexCompLen,
    //   keywordSummary.keyIndexDecompLen,
    //   this._decryptors[1],
    // );
    // compressed key block info
    let keyBlockInfoCompressed = this.slice(this.offset, keywordSummary.keyIndexCompLen);
    const kbcdv = new DataView(keyBlockInfoCompressed);
    const compType2 = kbcdv.getUint8(0);
    let keyBlockInfo = null;
    if (this._v2) {
      // zlib compression
      if (compType2 !== 2) {
        throw new Error("version > 2, not gzip compression");
      }
      if (this.attrs.Encrypted === 0x02) {
        // decrypt
        // const passkey = new Uint8Array(8);
        // this.buffer.copy(passkey, 0, this.offset - 4, this.offset);
        // passkey.set([0x95, 0x36, 0x00, 0x00], 4);
        // temp = decryptor(temp, passkey);
        keyBlockInfoCompressed = this._decryptor[1](keyBlockInfoCompressed);
      }
      // decompress
      keyBlockInfo = pako.inflate(keyBlockInfoCompressed.slice(8));
      // adler checksum  Big-Endian
      // TODO: because of pako zlib implements,
      //       we do not have some alder32 checksum
      //       get methods.
      // adler32 = kbcdv.getUint32(4);
      // if (adler32 !== pako.adler32(keyBlockInfo) {
      // throw new Error("key block checksum not correct")
      // }
    } else if (compType2 === 1) {
      keyBlockInfo = lzo.decompress(
        keyBlockInfoCompressed,
        keywordSummary.keyIndexDecompLen, 1308672,
      );
    } else {
      keyBlockInfo = keyBlockInfoCompressed;
    }
    /** ***********************************
    * starts to decode the keyBlockInfo
    ************************************ */
    // new keyBlockInfo data view
    // const kbdv = new DataView(keyBlockInfo);

    const keyBlockInfoScanner = new Scanner(keyBlockInfo);
    keyBlockInfoScanner.attrs = this.attrs;
    keyBlockInfoScanner._bpu = this._bpu;
    keyBlockInfoScanner._tail = this._tail;
    keyBlockInfoScanner.config();
    // keyBlockInfoScanner.forward(8);

    const keywordIndex = Array(keywordSummary.numBlocks);
    let offset = 0;

    for (let i = 0, size; i < keywordSummary.numBlocks; i++) {
    // for (let i = 0, size; i < 2; i++) {
      keywordIndex[i] = {
        num_entries: conseq(keyBlockInfoScanner.readNum()),
        // UNUSED, can be ignored
        first_size: size = keyBlockInfoScanner.readShort(),
        // TODO: readTextSized will be out of bound
        // UNYSED, can be ignored
        // first_word: conseq(keyBlockInfoScanner.readTextSized(size)),
        first_word: keyBlockInfoScanner.forward(size),
        // UNUSED, can be ignored
        last_size: size = keyBlockInfoScanner.readShort(),
        // last_word: keyBlockInfoScanner.readTextSized(size),
        last_word: keyBlockInfoScanner.forward(size),
        comp_size: size = keyBlockInfoScanner.readNum(),
        decomp_size: keyBlockInfoScanner.readNum(),
        // extra fields
        offset, // offset of the first byte for the target key block in mdx/mdd file
        index: i, // index of this key index, used to search previous/next block
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
  readKeyBlock(keyWordIndex, keyBlockBuffer) {
    let i = 0;
    const keyList = [];
    const dataView = new DataView(keyBlockBuffer);
    for (i = 0; i < keyWordIndex.length; i++) {
      const keyWordIdx = keyWordIndex[i];
      const start = i;
      const end = i + keyWordIdx.comp_size;
      // 4 bytes: compression type
      const keyBlockType = dataView.getUint8(start);
      // 4 bytes : adler32 checksum of decompressed key block
      // TODO: checksum check
      // const adler32 = dataView.getUint32(start + 4, start + 8);
      let keyBlock = null;
      if (keyBlockType === 0) {
        keyBlock = keyBlockBuffer.slice(start + 8, end);
      } else if (keyBlockType === 1) {
        // lzo compression
        const header = new ArrayBuffer([0xf0, keyWordIdx.decomp_size]);
        keyBlock = lzo.decompress(_appendBuffer(header, keyBlockBuffer.slice(start + 8, end)));
      } else if (keyBlockType === 2) {
        keyBlock = pako.inflate(keyBlockBuffer.slice(start + 8, end));
      }
      keyList.push(this.splitKeyBlock(keyBlock.buffer));
      // checksum pass
      // assert(adler32 == zlib.adler32(key_block) & 0xffffffff);
      i += keyWordIdx.compressed_size;
    }
    return keyList;
  }
  /**
   * split all keys from portion key blocks
   * @param {ArrayBuffer} keyBlock the portion key block arrayBuffer
   */
  splitKeyBlock(keyBlock) {
    const keyList = [];
    let keyStartIndex = 0;
    let keyId = 0;
    let delimiter = new Uint8Array([0x00]);
    let width = 1;
    const dataView = new DataView(keyBlock);

    while (keyStartIndex < keyBlock.byteLength) {
      if (this._v2) {
        // uint64 8bytes
        keyId = dataView.getUint64(keyStartIndex);
      } else {
        // uint32 4bytes
        keyId = dataView.getUint32(keyStartIndex);
      }
      if (this.attrs.Encoding == UTF16) {
        delimiter = new Uint8Array([0x00, 0x00]);
        width = 2;
      }
      let i = keyStartIndex + this._number_width;

      let keyEndIndex = 0;
      while (i < keyBlock.byteLength) {
        if (bufferEqual(keyBlock.slice(i, i + width), delimiter)) {
          keyEndIndex = i;
          break;
        }
        i += width;
      }
      let keyText = keyBlock.slice(keyStartIndex + this._number_width, keyEndIndex);

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
  readRecordSect() {
    // record section, current offset and 32 bytes section
    // [1] num_blocks  8-bytes, Number items in record_blocks.
    //                 Does not need to equal the number of keyword blocks. Big-endian.
    // [2] num_entries 8-bytes, Total number of records in dictionary.
    //                 Should be equal to keyword_sect.num_entries. Big-endian.
    // [3] index_len   8-bytes, Total size of the comp_size[i] and decomp_size[i] variables.
    //                 In other words, should equal 16 times num_blocks. Big-endian.
    // [4] blocks_len  8-bytes, Total size of the comp_size[i] and decomp_size[i] variables.
    //                 In other words, should equal 16 times num_blocks. Big-endian.
    const mark = this.offset;
    let indexLen = 0;
    const recordSection = {
      // version < 2, readNum uint32
      // version >= 2.0 readNum uint64
      num_blocks: this.readNum(),
      num_entries: this.readNum(),
      index_len: indexLen = this.readNum(),
      blocks_len: this.readNum(),
      // extra field
      record_section_actual_len: this.offset - mark,
      record_block_start_offset: indexLen + this.offset,
    };
    return recordSection;
  }

  readRecordBlock(recordSection) {
    // recordBlcokTable
    // record block start current offset, length is recordSection.index_length
    // so input buffer is this.slice(this.offset, this.offset+recordSection.index_length)
    // block size
    const size = recordSection.num_blocks;
    // recordBlcokTable
    this.recordBlockTable = new RecordBlockTable(size + 1);
    let p0 = recordSection.record_block_start_offset;
    let p1 = 0;
    const recordIndex = new Array(size);
    for (let i = 0, rdx; i < size; i++) {
      recordIndex[i] = {
        comp_size: this.readNum(),
        decomp_size: this.readNum(),
      };
      rdx = recordIndex[i];
      this.recordBlockTable.put(p0, p1);
      p0 += rdx.comp_size;
      p1 += rdx.decomp_size;
    }
    this.recordBlockTable.put(p0, p1);
    return this.recordBlockTable;
  }
}

export default Scanner;
