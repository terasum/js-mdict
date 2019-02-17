import readChunk from "read-chunk";
import assert from "assert";
import BufferList from "bl";
import pako from "pako";
import bufferToArrayBuffer from "buffer-to-arraybuffer";
import { TextDecoder } from "text-encoding";

import common from "./common";
import lzo1x from "./lzo-wrapper";
import ripemd128 from "./ripemd128";

const UTF_16LE_DECODER = new TextDecoder("utf-16le");
const UTF16 = "UTF-16";

const UTF_8_DECODER = new TextDecoder("utf-8");
const UTF8 = "UTF-8";

const BIG5_DECODER = new TextDecoder("big5");
const BIG5 = "BIG5";

const GB18030_DECODER = new TextDecoder("gb18030");
const GB18030 = "GB18030";


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
  const tmp = new Uint8Array(buffer1.byteLength + buffer2.byteLength);
  tmp.set(new Uint8Array(buffer1), 0);
  tmp.set(new Uint8Array(buffer2), buffer1.byteLength);
  return tmp.buffer;
}

/**
 *
 * class Mdict, the basic mdict diction parser class
 */
class MDict {
  /**
   *
   * @param {string} fname
   * @param {string} passcode
   */
  constructor(fname, passcode) {
    // the mdict file name
    this.fname = fname;
    // the dictionary file decrypt pass code
    this._passcode = passcode;
    // the mdict file read offset
    this._offset = 0;
    // the dictionary file extension
    this.ext = common.getExtension(fname, "mdx");
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
      keyBlocksTotalSize: 0,
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
    this._readKeyBlockInfo();
    // console.log(this.keyBlockInfoList);

    // -------------------------
    // dict key block section
    // --------------------------
    this._keyBlockStartOffset = 0;
    this._keyBlockEndOffset = 0;
    this.keyList = [];
    this._decodeKeyBlock();

    // -------------------------
    // dict record header section
    // --------------------------
    this._recordHeaderStartOffset = 0;
    this._recordHeaderEndOffset = 0;
    this.recordHeader = {
      recordBlocksNum: 0,
      entriesNum: 0,
      recordBlockInfoCompSize: 0,
      recordBlockCompSize: 0,
    };
    this._decodeRecordHeader();
    console.log(this.recordHeader);
    // passed
    // this._decode_record_block();

    // -------------------------
    // dict record info section
    // --------------------------
    this._recordInfoStartOffset = 0;
    this._recordInfoEndOffset = 0;
    this.recordBlockInfoList = [];
    this._decodeRecordInfo();
    // console.log(this.recordBlockInfoList);


    // -------------------------
    // dict record block section
    // --------------------------
    this._recordBlockStartOffset = 0;
    this._recordBlockEndOffset = 0;
    this.keyData = [];
    this._decodeRecordBlock();
    console.log(this.keyData);


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
  contains(word) {
    if (!this.trie) {
      throw new Error("trie not build finished");
    }
    return this.trie.contain(word);
  }

  similar(word, tol) {
    return this.bktree.simWords(word, tol);
  }

  // return the word idx
  _lookup_idx(word) {
    if (!this.trie) {
      throw new Error("trie not build finished");
    }
    if (!this.contains(word)) {
      return -1;
    }
    return this.trie.lookup(word);
  }
  // look up the word definition
  lookup(word) {
    const idx = this._lookup_idx(word);
    if (idx === -1) {
      return "NOTFOUND";
    }
    return this.parse_defination(idx);
  }

  prefix(word) {
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
  fuzzy_search(word, fuzzy_size, ed_gap) {
    const fuzzy_words = [];
    this.prefix(word)
      .map(item => this._find_nabor(item.v, fuzzy_size)
        .map((w) => {
          const ed = common.levenshtein_distance(word, w.key);
          if (ed < (ed_gap || 5)) {
            fuzzy_words.push({
              ed,
              idx: w.idx,
              key: w.key,
            });
          }
          return null;
        }));
    return fuzzy_words;
  }

  _find_nabor(sim_idx, fuzzy_size) {
    const set_size = this.key_data.length;
    const sim_idx_start = sim_idx - fuzzy_size < 0
      ? 0
      : sim_idx - fuzzy_size;
    const sim_idx_end = sim_idx + fuzzy_size > set_size
      ? set_size
      : sim_idx + fuzzy_size;

    const nabor_words = [];

    for (let i = sim_idx_start; i < sim_idx_end; i++) {
      nabor_words.push({
        idx: i,
        key: this.key_data[i].key,
      });
    }
    return nabor_words;
  }

  _bsearch_sim_idx(word) {
    let lo = 0;
    let hi = this.key_data.length - 1;
    let mid = 0;
    // find last equal or less than key word
    while (lo <= hi) {
      mid = lo + ((hi - lo) >> 1);
      if (this.key_data[mid].key.localeCompare(word) > 0 /* word > key */) { hi = mid - 1; } else {
        lo = mid + 1;
      }
    }
    return hi;
  }

  bsearch(word) {
    let lo = 0;
    let hi = this.key_data.length - 1;
    let mid = 0;
    while (lo <= hi) {
      mid = lo + ((hi - lo) >> 1);
      if (this.key_data[mid].key.localeCompare(word) > 0 /* word > key */) { hi = mid - 1; }
      if (this.key_data[mid].key.localeCompare(word) < 0 /* word < key */) { lo = mid + 1; }
      if (this.key_data[mid].key.localeCompare(word) == 0) { break; }
    }
    if (lo > hi) {
      // not found
      console.log("not found!");
      return undefined;
    }

    return this.parse_defination(mid);
  }
  parse_defination(idx) {
    const word_info = this.key_data[idx];
    if (!word_info || word_info == undefined) {
      return "NOTFOUND";
    }
    let defbuf = this._readBuffer(word_info.record_comp_start, word_info.record_compressed_size);
    if (word_info.record_comp_type == "zlib") {
      defbuf = pako.inflate(defbuf.slice(8, defbuf.length));
    } else {
      return "NOT_SUPPORT_COMPRESS_TYPE";
    }
    if (this.ext == "mdx") {
      return this._decoder
        .decode(defbuf.slice(word_info.relateive_record_start, word_info.relative_record_end));
    }
    return defbuf.slice(word_info.relateive_record_start, word_info.relative_record_end);
  }

  /**
   * STEP 1. read diction header
   * Get mdx header info (xml content to object)
   * [0:4], 4 bytes header length (header_byte_size), big-endian, 4 bytes, 16 bits
   * [4:header_byte_size + 4] header_bytes
   * [header_bytes_size + 4:header_bytes_size +8] adler32 checksum
   * should be:
   * assert(zlib.adler32(header_bytes) & 0xffffffff, adler32)
   *
   */
  _readHeader() {
    // [0:4], 4 bytes header length (header_byte_size), big-endian, 4 bytes, 16 bits
    const header_size_buffer = this._readBuffer(0, 4);
    const headerByteSize = common.readNumber(header_size_buffer, common.NUMFMT_UINT32);

    // [4:header_byte_size + 4] header_bytes
    const headerBuffer = readChunk.sync(this.fname, 4, headerByteSize);

    // TODO: SKIP 4 bytes alder32 checksum
    // header_b_cksum should skip for now, because cannot get alder32 sum by js
    // const header_b_cksum = readChunk.sync(this.fname, header_byte_size + 4, 4);

    // console.log(hash("alder32", header_b_buffer));
    // console.log(header_b_cksum);
    // assert(header_b_cksum), "header_bytes checksum failed");

    // 4 bytes header size + header_bytes_size + 4bytes alder checksum
    this._headerEndOffset = headerByteSize + 4 + 4;

    this._keyHeaderStartOffset = headerByteSize + 4 + 4;

    // set file read offset
    this._offset = this._headerEndOffset;

    // header text in utf-16 encoding ending with `\x00\x00`, so minus 2
    const headerText = common.readUTF16(headerBuffer, 0, headerByteSize - 2);

    // parse header info
    this.headerInfo = common.parseHeader(headerText);


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
      this._numWidth = 8;
      this._numFmt = common.NUMFMT_UINT64;
    } else {
      this._numWidth = 4;
      this._numFmt = common.NUMFMT_UINT32;
    }
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
      this._encoding =
      (this.headerInfo.Encoding.toLowerCase() == "utf16"
      || this.headerInfo.Encoding.toLowerCase() == "utf-16") ?
        UTF16 : UTF8;
      if (this._encoding == UTF16) {
        this._decoder = UTF_16LE_DECODER;
      } else {
        this._decoder = UTF_8_DECODER;
      }
    }
    // console.log(this._encoding);
  }

  /**
   * STEP 2. read key block header
   * read key block header
   */
  _readKeyHeader() {
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
    const bytesNum = this._version >= 2.0 ? 8 * 5 : 4 * 4;
    const keyHeaderBuff = this._readBuffer(this._keyHeaderStartOffset, bytesNum);

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

    let ofset = 0;
    // [0:8]   - number of key blocks
    const keyBlockNumBuff = keyHeaderBuff.slice(ofset, ofset + this._numWidth);
    this.keyHeader.keyBlocksNum = common.readNumber(keyBlockNumBuff, this._numFmt);
    ofset += this._numWidth;
    // console.log("num_key_blocks", num_key_blocks.toString());

    // [8:16]  - number of entries
    const entriesNumBuff = keyHeaderBuff.slice(ofset, ofset + this._numWidth);
    this.keyHeader.entriesNum =
    common.readNumber(entriesNumBuff, this._numFmt);
    ofset += this._numWidth;
    // console.log("num_entries", num_entries.toString());

    // [16:24] - number of key block info decompress size
    if (this._version >= 2.0) { // only for version > 2.0
      const keyBlockInfoDecompBuff = keyHeaderBuff.slice(ofset, ofset + this._numWidth);
      const keyBlockInfoDecompSize = common.readNumber(keyBlockInfoDecompBuff, this._numFmt);
      ofset += this._numWidth;
      // console.log(key_block_info_decomp_size.toString());
      this.keyHeader.keyBlockInfoDecompSize = keyBlockInfoDecompSize;
    }

    // [24:32] - number of key block info compress size
    const keyBlockInfoSizeBuff = keyHeaderBuff.slice(ofset, ofset + this._numWidth);
    const keyBlockInfoSize = common.readNumber(keyBlockInfoSizeBuff, this._numFmt);
    ofset += this._numWidth;
    // console.log("key_block_info_size", key_block_info_size.toString());
    this.keyHeader.keyBlockInfoCompSize = keyBlockInfoSize;

    // [32:40] - number of key blocks total size, note, key blocks total size, not key block info
    const keyBlocksTotalSizeBuff = keyHeaderBuff.slice(ofset, ofset + this._numWidth);
    const keyBlocksTotalSize =
    common.readNumber(keyBlocksTotalSizeBuff, this._numFmt);
    ofset += this._numWidth;
    // console.log(key_blocks_total_size.toString());
    this.keyHeader.keyBlocksTotalSize = keyBlocksTotalSize;

    // 4 bytes alder32 checksum, after key info block
    // TODO: skip for now, not support yet
    if (this._version >= 2.0) {
      // this.__skip_bytes(4);
    }
    console.log(this.keyHeader);
    // set end offset
    this._keyHeaderEndOffset =
    this._keyHeaderStartOffset + bytesNum + 4; /* 4 bytes adler32 checksum length */
  }

  /**
   * STEP 3. read key block info, if you want quick search, read at here already enough
   * read key block info
   * key block info list
   */
  _readKeyBlockInfo() {
    this._keyBlockInfoStartOffset = this._keyHeaderEndOffset;
    const keyBlockInfoBuff = this._readBuffer(
      this._keyBlockInfoStartOffset,
      this.keyHeader.keyBlockInfoCompSize,
    );
    const keyBlockInfoList =
    this._decodeKeyBlockInfo(keyBlockInfoBuff);
    this._keyBlockInfoEndOffset =
    this._keyBlockInfoStartOffset + this.keyHeader.keyBlockInfoCompSize;
    assert(this.keyHeader.keyBlocksNum === keyBlockInfoList.length, "the num_key_info_list should equals to key_block_info_list");
    this.keyBlockInfoList = keyBlockInfoList;
    // NOTE: must set at here, otherwise, if we haven't invoke the _decodeKeyBlockInfo method,
    // var `_recordBlockStartOffset` will not be setted.
    this._recordBlockStartOffset = this._keyBlockInfoEndOffset + this.keyHeader.keyBlocksTotalSize;
  }

  /**
   * STEP 4. decode key block info, this function will invokde in `_readKeyBlockInfo`
   * and decode the first key and last key infomation, etc.
   * @param {Buffer} keyBlockInfoBuff key block info buffer
   */
  _decodeKeyBlockInfo(keyBlockInfoBuff) {
    const keyBlockNum = this.keyHeader.keyBlocksNum;
    const num_entries = this.keyHeader.entriesNum;
    let kbInfoBuff;
    if (this._version >= 2.0) {
      // zlib compression
      assert(
        keyBlockInfoBuff.slice(0, 4).toString("hex") === "02000000",
        "the compress type zlib should start with 0x02000000",
      );
      let kbInfoCompBuff;
      if (this._encrypt === 2) {
        kbInfoCompBuff = this.__mdx_decrypt(keyBlockInfoBuff);
      }
      // For version 2.0, will compress by zlib, lzo just just for 1.0
      // key_block_info_compressed[0:8] => compress_type
      kbInfoBuff = pako.inflate(kbInfoCompBuff.slice(
        8,
        kbInfoCompBuff.length,
      ));
      // TODO: check the alder32 checksum
      // adler32 = unpack('>I', key_block_info_compressed[4:8])[0]
      // assert(adler32 == zlib.adler32(key_block_info) & 0xffffffff)
    } else {
      kbInfoBuff = keyBlockInfoBuff;
    }
    assert(this.keyHeader.keyBlockInfoDecompSize == kbInfoBuff.length, "key_block_info length should equal");
    const key_block_info_list = [];

    // init tmp variables
    let countEntriesNum = 0;
    let byteFmt = common.NUMFMT_UINT16;
    let byteWidth = 2;
    let textTerm = 1;
    if (this._version >= 2.0) {
      byteFmt = common.NUMFMT_UINT16;
      byteWidth = 2;
      textTerm = 1;
    } else {
      byteFmt = common.NUMFMT_UINT8;
      byteWidth = 1;
      textTerm = 0;
    }
    let termSize = textTerm;

    let kbCount = 0;
    let i = 0;

    let kbCompSizeAccu = 0;
    let kbDeCompSizeAccu = 0;
    while (kbCount < keyBlockNum) {
      // number of entries in current key block
      const currKBEntriesCount =
      common.readNumber(kbInfoBuff.slice(i, i + this._numWidth), this._numFmt);
      i += this._numWidth;

      const firstKeySize = common.readNumber(kbInfoBuff.slice(i, i + byteWidth), byteFmt);
      i += byteWidth;

      // step gap
      let stepGap = 0;
      // term_size is for first key and last key
      // let term_size = 0;
      if (this._encoding === UTF16) {
        stepGap = (firstKeySize + textTerm) * 2;
        termSize = textTerm * 2;
      } else {
        stepGap = firstKeySize + textTerm;
      }
      // Note: key_block_first_key and last key not need to decode now
      const firstKeyBuf = kbInfoBuff.slice(i, i + stepGap);
      const firstKey = this._decoder.decode(firstKeyBuf.slice(0, firstKeyBuf.length - termSize));
      i += stepGap;

      // text tail
      const lastKeySize = common.readNumber(kbInfoBuff.slice(i, i + byteWidth), byteFmt);
      i += byteWidth;
      if (this._encoding === UTF16) {
        stepGap = (lastKeySize + textTerm) * 2;
        // TODO: this is for last key output
        termSize = textTerm * 2;
      } else {
        stepGap = lastKeySize + textTerm;
      }

      // lastKey
      const lastKeyBuf = kbInfoBuff.slice(i, i + stepGap);
      const lastKey = this._decoder.decode(lastKeyBuf.slice(0, lastKeyBuf.length - termSize));
      i += stepGap;

      // key block compressed size
      const kbCompSize = common.readNumber(kbInfoBuff.slice(i, i + this._numWidth), this._numFmt);

      i += this._numWidth;

      // key block decompressed size
      const kbDecompSize = common.readNumber(kbInfoBuff.slice(i, i + this._numWidth), this._numFmt);
      i += this._numWidth;

      /**
       *  PUSH key info item
       * definition of key info item:
       * {
       *    firstKey: string,
       *    lastKey: string,
       *    keyBlockCompSize: number,
       *    keyBlockCompAccumulator: number,
       *    keyBlockDecompSize: number,
       *    keyBlockDecompAccumulator: number,
      //  *    keyBlockStartOffset: number,
       *    keyBlockEntriesNum: number,
       *    keyBlockEntriesAccumulator: number,
       *    keyBlockIndex: count,
       * }
       */
      key_block_info_list.push({
        firstKey,
        lastKey,
        keyBlockCompSize: kbCompSize,
        keyBlockCompAccumulator: kbCompSizeAccu,
        keyBlockDecompSize: kbDecompSize,
        keyBlockDecompAccumulator: kbDeCompSizeAccu,
        // keyBlockStartOffset: number,
        keyBlockEntriesNum: currKBEntriesCount,
        keyBlockEntriesAccumulator: countEntriesNum,
        keyBlockIndex: kbCount,
      });

      kbCount += 1; // key block number
      countEntriesNum += currKBEntriesCount;
      kbCompSizeAccu += kbCompSize;
      kbDeCompSizeAccu += kbDecompSize;
    }
    assert(countEntriesNum === num_entries, "the number_entries should equal the count_num_entries");
    assert(kbCompSizeAccu === this.keyHeader.keyBlocksTotalSize);
    return key_block_info_list;
  }

  /**
   * decode key block return the total keys list,
   * Note: this method runs very slow, please do not use this unless special target
   */
  _decodeKeyBlock() {
    this._keyBlockStartOffset = this._keyBlockInfoEndOffset;
    const kbCompBuff =
    this._readBuffer(this._keyBlockStartOffset, this.keyHeader.keyBlocksTotalSize);

    let key_list = [];
    let kbStartOfset = 0;
    // harvest keyblocks
    for (let idx = 0; idx < this.keyBlockInfoList.length; idx++) {
      const compSize = this.keyBlockInfoList[idx].keyBlockCompSize;
      const decompressed_size = this.keyBlockInfoList[idx].keyBlockDecompSize;
      const start = kbStartOfset;
      assert(start === this.keyBlockInfoList[idx].keyBlockCompAccumulator, "should be equal");

      const end = kbStartOfset + compSize;
      // 4 bytes : compression type
      const kbCompType = new BufferList(kbCompBuff.slice(start, start + 4));
      // TODO 4 bytes adler32 checksum
      // # 4 bytes : adler checksum of decompressed key block
      // adler32 = unpack('>I', key_block_compressed[start + 4:start + 8])[0]

      let key_block;
      if (kbCompType.toString("hex") == "00000000") {
        key_block = kbCompBuff.slice(start + 8, end);
      } else if (kbCompType.toString("hex") == "01000000") {
        // # decompress key block
        const header = new ArrayBuffer([0xf0, decompressed_size]);
        const keyBlock = lzo1x.decompress(
          _appendBuffer(header, kbCompBuff.slice(start + 8, end)),
          decompressed_size, 1308672,
        );
        key_block = bufferToArrayBuffer(keyBlock)
          .slice(keyBlock.byteOffset, keyBlock.byteOffset + keyBlock.byteLength);
      } else if (kbCompType.toString("hex") === "02000000") {
        // decompress key block
        key_block = pako.inflate(kbCompBuff.slice(start + 8, end));
        // extract one single key block into a key list
        // notice that adler32 returns signed value
        // TODO compare with privious word
        // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)
      } else {
        throw Error(`cannot determine the compress type: ${kbCompType.toString("hex")}`);
      }
      const splitedKey = this._splitKeyBlock(
        new BufferList(key_block),
        this._numFmt, this._numWidth, this._encoding,
      );
      key_list = key_list.concat(splitedKey);
      kbStartOfset += compSize;
    }
    assert(key_list.length === this.keyHeader.entriesNum);
    this._keyBlockEndOffset = this._keyBlockStartOffset + this.keyHeader.keyBlocksTotalSize;
    this.keyList = key_list;
  }

  /**
   * split key from key block buffer
   * @param {Buffer} keyBlock key block buffer
   */
  _splitKeyBlock(keyBlock) {
    let delimiter;
    let width;
    if (this._encoding == "UTF-16") {
      delimiter = "0000";
      width = 2;
    } else {
      delimiter = "00";
      width = 1;
    }
    const keyList = [];
    let keyStartIndex = 0;
    let keyEndIndex = 0;

    while (keyStartIndex < keyBlock.length) {
      // # the corresponding record's offset in record block
      const recordStartOffset =
      common.readNumber(
        keyBlock.slice(keyStartIndex, keyStartIndex + this._numWidth),
        this._numFmt,
      );
      // # key text ends with '\x00'
      let i = keyStartIndex + this._numWidth;
      while (i < keyBlock.length) {
        if (new BufferList(keyBlock.slice(i, i + width)).toString("hex") == delimiter) {
          keyEndIndex = i;
          break;
        }
        i += width;
      }
      const keyText =
      this._decoder.decode(keyBlock.slice(keyStartIndex + this._numWidth, keyEndIndex));
      keyStartIndex = keyEndIndex + width;
      keyList.push({ recordStartOffset, keyText });
    }
    return keyList;
  }

  _decodeRecordHeader() {
    /**
     * decode the record block header section
     * [0:8/4]    - record block number
     * [8:16/4:8] - num entries the key-value entries number
     * [16:24/8:12] - record block info size
     * [24:32/12:16] - record block size
     */

    this._recordHeaderStartOffset = this._keyBlockInfoEndOffset + this.keyHeader.keyBlocksTotalSize;
    const rhlen = (this._version >= 2.0) ? 4 * 8 : 4 * 4;
    this._recordHeaderEndOffset = this._recordHeaderStartOffset + rhlen;
    const rhBuff = this._readBuffer(this._recordHeaderStartOffset, rhlen);
    let ofset = 0;
    const recordBlocksNum =
    common.readNumber(rhBuff.slice(ofset, ofset + this._numWidth), this._numFmt);
    ofset += this._numWidth;
    const entriesNum = common.readNumber(rhBuff.slice(ofset, ofset + this._numWidth), this._numFmt);
    assert(entriesNum === this.keyHeader.entriesNum);
    ofset += this._numWidth;
    const recordBlockInfoCompSize =
    common.readNumber(rhBuff.slice(ofset, ofset + this._numWidth), this._numFmt);
    ofset += this._numWidth;
    const recordBlockCompSize =
    common.readNumber(rhBuff.slice(ofset, ofset + this._numWidth), this._numFmt);
    this.recordHeader = {
      recordBlocksNum,
      entriesNum,
      recordBlockInfoCompSize,
      recordBlockCompSize,
    };
  }

  _decodeRecordInfo() {
    this._recordInfoStartOffset = this._recordHeaderEndOffset;
    const riBuff =
    this._readBuffer(this._recordInfoStartOffset, this.recordHeader.recordBlockInfoCompSize);
    /**
     * record_block_info_list:
     * [{
     *   compSize: number
     *   compAccumulator: number
     *   decompSize: number,
     *   decompAccumulator: number
     * }]
     * Note: every record block will contrains a lot of entries
     */
    const recordBlockInfoList = [];
    let ofset = 0;
    let compAccu = 0;
    let decompAccu = 0;
    for (let i = 0; i < this.recordHeader.recordBlocksNum; i++) {
      const compSize =
      common.readNumber(riBuff.slice(ofset, ofset + this._numWidth), this._numFmt);
      ofset += this._numWidth;
      const decompSize =
      common.readNumber(riBuff.slice(ofset, ofset + this._numWidth), this._numFmt);
      ofset += this._numWidth;

      recordBlockInfoList.push({
        compSize,
        compAccumulator: compAccu,
        decompSize,
        decompAccumulator: decompAccu,
      });
      compAccu += compSize;
      decompAccu += decompSize;
    }
    assert(ofset === this.recordHeader.recordBlockInfoCompSize);
    assert(compAccu === this.recordHeader.recordBlockCompSize);
    this.recordBlockInfoList = recordBlockInfoList;
    this._recordInfoEndOffset =
    this._recordInfoStartOffset + this.recordHeader.recordBlockInfoCompSize;
  }

  _decodeRecordBlock() {
    this._recordBlockStartOffset = this._recordInfoEndOffset;
    const keyData = [];

    /**
     * start reading the record block
     */
    // actual record block
    let sizeCounter = 0;
    let item_counter = 0;
    let recordOffset = this._recordBlockStartOffset;

    for (let idx = 0; idx < this.recordBlockInfoList.length; idx++) {
      let comp_type = "none";
      const compSize = this.recordBlockInfoList[idx].compSize;
      const decompSize = this.recordBlockInfoList[idx].decompSize;
      const rbCompBuff = this._readBuffer(recordOffset, compSize);
      recordOffset += compSize;

      // 4 bytes: compression type
      const rbCompType = new BufferList(rbCompBuff.slice(0, 4));

      // record_block stores the final record data
      let recordBlock;

      // TODO: igore adler32 offset
      // Note: here ignore the checksum part
      // bytes: adler32 checksum of decompressed record block
      // adler32 = unpack('>I', record_block_compressed[4:8])[0]
      if (rbCompType.toString("hex") === "00000000") {
        recordBlock = rbCompBuff.slice(8, rbCompBuff.length);
      } else {
        // --------------
        // decrypt
        // --------------
        let blockBufDecrypted = null;
        // if encrypt type == 1, the record block was encrypted
        if (this._encrypt === 1 /* || (this.ext == "mdd" && this._encrypt === 2 ) */) {
          // const passkey = new Uint8Array(8);
          // record_block_compressed.copy(passkey, 0, 4, 8);
          // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
          blockBufDecrypted =
            this.__mdx_decrypt(rbCompBuff);
        } else {
          blockBufDecrypted = rbCompBuff.slice(8, rbCompBuff.length);
        }
        // --------------
        // decompress
        // --------------
        if (rbCompType.toString("hex") === "01000000") {
          comp_type = "lzo";
          // the header was need by lzo library, should append before real compressed data
          const header = new ArrayBuffer([0xf0, decompSize]);
          // Note: if use lzo, here will LZO_E_OUTPUT_RUNOVER, so ,use mini lzo js
          recordBlock =
            lzo1x.decompress(_appendBuffer(header, blockBufDecrypted), decompSize, 1308672);
          recordBlock = bufferToArrayBuffer(recordBlock)
            .slice(recordBlock.byteOffset, recordBlock.byteOffset + recordBlock.byteLength);
        } else if (rbCompType.toString("hex") === "02000000") {
          comp_type = "zlib";
          // zlib decompress
          recordBlock = pako.inflate(blockBufDecrypted);
        }
      }
      recordBlock = new BufferList(recordBlock);

      // notice that adler32 return signed value
      // TODO: ignore the checksum
      // assert(adler32 == zlib.adler32(record_block) & 0xffffffff)

      assert(recordBlock.length === decompSize);

      /**
       * 请注意，block 是会有很多个的，而每个block都可能会被压缩
       * 而 key_list中的 record_start, key_text是相对每一个block而言的，end是需要每次解析的时候算出来的
       * 所有的record_start/length/end都是针对解压后的block而言的
       */

      // split record block according to the offset info from key block
      let offset = 0;
      let i = 0;
      while (i < this.keyList.length) {
        const recordStart = this.keyList[i].recordStartOffset;
        const keyText = this.keyList[i].keyText;

        // # reach the end of current record block
        if (recordStart - offset >= recordBlock.length) {
          break;
        }
        // # record end index
        let recordEnd;
        if (i < this.keyList.length - 1) {
          recordEnd = this.keyList[i + 1].recordStartOffset;
        } else {
          recordEnd = recordBlock.length + offset;
        }
        i += 1;
        // const data = record_block.slice(record_start - offset, record_end - offset);
        keyData.push({
          key: keyText,
          idx: item_counter,
          // data,
          encoding: this._encoding,
          // record_start,
          // record_end,
          record_idx: idx,
          record_comp_start: recordOffset,
          record_compressed_size: compSize,
          record_decompressed_size: decompSize,
          record_comp_type: comp_type,
          record_encrypted: this._encrypt === 1,
          relateive_record_start: recordStart - offset,
          relative_record_end: recordEnd - offset,
        });

        item_counter++;
      }
      offset += recordBlock.length;
      sizeCounter += compSize;
    }

    assert(sizeCounter === this.recordHeader.recordBlockCompSize);

    this.keyData = keyData;
    this._recordBlockEndOffset = this._recordBlockStartOffset + sizeCounter;
  }


  //-----------------------
  //  assistant functions
  //-----------------------

  // def _mdx_decrypt(comp_block):
  //   key = ripemd128(comp_block[4:8] + pack(b'<L', 0x3695))
  //   return comp_block[0:8] + _fast_decrypt(comp_block[8:], key)
  __mdx_decrypt(comp_block) {
    const key = ripemd128.ripemd128(new BufferList(comp_block.slice(4, 8))
      .append(Buffer.from([0x95, 0x36, 0x00, 0x00])).slice(0, 8));
    return new BufferList(comp_block.slice(0, 8))
      .append(this.__fast_decrypt(comp_block.slice(8), key));
  }

  __fast_decrypt(data, k) {
    const b = new Uint8Array(data);
    const key = new Uint8Array(k);
    let previous = 0x36;
    for (let i = 0; i < b.length; ++i) {
      let t = ((b[i] >> 4) | (b[i] << 4)) & 0xff;
      t = t ^ previous ^ (i & 0xff) ^ key[i % key.length];
      previous = b[i];
      b[i] = t;
    }
    return new BufferList(b);
  }

  _readBuffer(start, length) {
    return readChunk.sync(this.fname, start, length);
  }
}

export default MDict;
