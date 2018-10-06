import struct from "python-struct";
import readChunk from "read-chunk";
import assert from "assert";
import BufferList from "bl";
import pako from "pako";
import Long from "long";
import bufferToArrayBuffer from "buffer-to-arraybuffer";
import dart from "doublearray";

import { TextDecoder } from "text-encoding";
import { DOMParser } from "xmldom";

import common from "./common";
import lzo1x from "./lzo-wrapper";
import ripemd128 from "./ripemd128";

// 开启多线程能力
// const cluster = require("cluster");
// const numCPUs = require("os").cpus().length;

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
 * judge num equal or not
 */
function _numEqual(num1, num2) {
  let a;
  let b;
  if (!Long.isLong(num1)) {
    a = new Long(num1, 0);
  } else {
    a = num1;
  }
  if (!Long.isLong(num2)) {
    b = new Long(num2, 0);
  } else {
    b = num2;
  }
  return a.eq(b);
}

// Mdict is the base class
// It has no public method just for extend by sub class
class MDict {
  constructor(fname, _passcode) {
    this.fname = fname;
    this._offset = 0;
    this.ext = common.getExtension(fname, "mdx");
    this._read_header();
    if (this.ext === "mdd") {
      this._encoding = UTF16;
      this._decoder = UTF_16LE_DECODER;
    }
    // console.log("Dictionary version", this._version);
    const d1 = new Date().getTime();
    this._key_list = this._read_keys();
    const d2 = new Date().getTime();
    console.log(`read key used: ${(d2 - d1) / 1000.0} s`);
    this._passcode = _passcode;
    const d3 = new Date().getTime();
    this.key_data = this._decode_record_block();
    const d4 = new Date().getTime();
    console.log(`decod record used: ${(d4 - d3) / 1000.0}`);
    // for (let i = 0; i < 10; i++) {
    //   console.log(this.key_data[i].key);
    // }
    // console.log(this.key_data
    // .map(keyword => ({ k: keyword.key, v: keyword })));
    // TODO: out of memory
    // this.bktree = new BKTree(this.key_data.length);
    this.trie = dart.builder()
      .build(this.key_data
        .map(keyword =>
          // TODO: bktree here will out of memory
          // this.bktree.add(keyword.key);
          // cousole.log(keyword.key)
          ({ k: keyword.key, v: keyword.idx })));
    const d5 = new Date().getTime();
    console.log(`dart build used: ${(d5 - d4) / 1000.0} s`);
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
    let defbuf = this.__readbuffer(word_info.record_comp_start, word_info.record_compressed_size);
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

  /*
   * get mdx header info:
   * [0:4] 字节： header 的长度(header_bytes_size), 大端（4Bytes, 16bits）
   * [4:header_byte_size + 4] header_bytes
   * [header_bytes_size + 4:header_bytes_size +8] adler32 checksum
   * 应当满足:
   * assert(zlib.adler32(header_bytes) & 0xffffffff, adler32)
   *
   */
  _read_header() {
    const header_size_buffer = readChunk.sync(this.fname, 0, 4);
    const header_byte_size = struct.unpack(">I", header_size_buffer)[0];
    const header_b_buffer = readChunk.sync(this.fname, 4, header_byte_size);

    // header_b_cksum should skip for now, because cannot get alder32 sum by js
    // const header_b_cksum = readChunk.sync(this.fname, header_byte_size + 4, 4);
    // console.log(hash("alder32", header_b_buffer));
    // console.log(header_b_cksum);
    // assert(header_b_cksum), "header_bytes checksum failed");

    // 4 bytes header size + header_bytes_size + 4bytes alder checksum
    this._key_block_offset = header_byte_size + 4 + 4;
    this.offset = this._key_block_offset;
    // header text in utf-16 encoding ending with `\x00\x00`, so minus 2
    const header_text = common.readUTF16(header_b_buffer, 0, header_byte_size - 2);
    // parse header info
    this.header_info = parseHeader(header_text);

    // encrypted flag
    // 0x00 - no encryption
    // 0x01 - encrypt record block
    // 0x02 - encrypt key info block
    if (!this.header_info.Encrypted || this.header_info.Encrypted == "" || this.header_info.Encrypted == "No") {
      this._encrypt = 0;
    } else if (this.header_info.Encrypted == "Yes") {
      this._encrypt = 1;
    } else {
      this._encrypt = parseInt(this.header_info.Encrypted, 10);
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

    // before version 2.0, number is 4 bytes integer
    // version 2.0 and above use 8 bytes
    this._version = parseFloat(this.header_info.GeneratedByEngineVersion);
    if (this._version >= 2.0) {
      this._number_width = 8;
      this._number_format = ">Q";
    } else {
      this._number_format = ">I";
      this._number_width = 4;
    }
    // console.log(this.header_info);
    if (!this.header_info.Encoding || this.header_info.Encoding == "") {
      this._encoding = UTF8;
      this._decoder = UTF_8_DECODER;
    } else if (this.header_info.Encoding == "GBK" || this.header_info.Encoding == "GB2312") {
      this._encoding = GB18030;
      this._decoder = GB18030_DECODER;
    } else if (this.header_info.Encoding.toLowerCase() == "big5") {
      this._encoding = BIG5;
      this._decoder = BIG5_DECODER;
    } else {
      this._encoding =
      (this.header_info.Encoding.toLowerCase() == "utf16"
      || this.header_info.Encoding.toLowerCase() == "utf-16") ?
        UTF16 : UTF8;
      if (this._encoding == UTF16) {
        this._decoder = UTF_16LE_DECODER;
      } else {
        this._decoder = UTF_8_DECODER;
      }
    }
    // console.log(this._encoding);
  }

  _read_keys() {
    let num_bytes;
    if (this._version >= 2.0) {
      num_bytes = 8 * 5;
    } else {
      num_bytes = 4 * 4;
    }
    const key_info_b = this.__readfile(num_bytes);

    // TODO: encrypted file not support yet
    if (this._encrypt & 1) {
      if (!this._passcode || this._passcode == "") {
        throw Error(" user identification is needed to read encrypted file");
      }
      // regcode, userid = header_info['_passcode']
      if (this.header_info.RegisterBy == "Email") {
        // encrypted_key = _decrypt_regcode_by_email(regcode, userid);
        throw Error("encrypted file not support yet");
      } else {
        throw Error("encrypted file not support yet");
      }
    }

    // header info struct:
    // [0:8]   - number of key blocks
    // [8-16]  - number of entries
    // [16:24] - key block info decompressed size (if version >= 2.0, else not exist)
    // [24:32] - key block info size
    // [32:40] - key block size
    // note: if version <2.0, the key info buffer size is 4 * 4
    //       otherwise, ths key info buffer size is 5 * 8
    // <2.0  the order of number is same

    let key_i_ofst = 0;
    // number of key blocks, passed
    const num_key_blocks =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log("num_key_blocks", num_key_blocks.toString());

    // number of entries
    const num_entries =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log("num_entries", num_entries.toString());
    this._num_entries = num_entries;

    // number of key block info decompress size
    if (this._version >= 2.0) {
      const key_block_info_decomp_size =
      this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
      key_i_ofst += this._number_width;
      // console.log(key_block_info_decomp_size.toString());
      this.header_info.key_block_info_decomp_size = key_block_info_decomp_size;
    }

    // number of key block info compress size
    const key_block_info_size =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log("key_block_info_size", key_block_info_size.toString());
    this.header_info.key_block_info_comp_size = key_block_info_size;

    // number of key blocks total size, note, key blocks total size, not key block info
    const key_blocks_total_size =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log(key_blocks_total_size.toString());
    this.header_info.key_blocks_total_size = key_blocks_total_size;

    // 4 bytes alder32 checksum, after key info block
    // TODO: skip for now, not support yet
    if (this._version >= 2.0) {
      this.__skip_bytes(4);
    }


    // ------------------------
    // HERE PASSED
    // ------------------------
    // console.log(this.offset);

    const key_block_info = this.__readfile(this.__toNumber(key_block_info_size));
    // console.log(key_block_info.slice(0, 20).toString("hex"));
    const key_block_info_list =
    this._decode_key_block_info(num_key_blocks, key_block_info, num_entries);
    // assert(num_key_blocks == len(key_block_info_list))

    assert(this.__toNumber(num_key_blocks) === key_block_info_list.length, "the num_key_info_list should equals to key_block_info_list");

    // key_block_compress part
    // ====================
    // key_block_compress
    // ====================
    // console.log("key_blocks_total_size", key_blocks_total_size);
    const key_block_compressed =
      new BufferList(this.__readfile(this.__toNumber(key_blocks_total_size)));

    // -------- 到这里为止都是正确的


    // console.log("key_block_info_list", key_block_info_list);
    const key_list = this._decode_key_block(key_block_compressed, key_block_info_list);
    // console.log("key_list", key_list);
    this._record_block_offset = this.offset;
    return key_list;
  }

  // TODO 修改为多线程版本
  _decode_key_block(key_block_compressed, key_block_info_list) {
    // console.log(this._encoding);
    let key_list = [];
    let i = 0;

    // harvest keyblocks
    const keyBlocks = [];
    for (let idx = 0; idx < key_block_info_list.length; idx++) {
      // console.log(" aaa", key_block_info_list[idx], idx);

      const compressed_size = key_block_info_list[idx][0];
      const decompressed_size = key_block_info_list[idx][1];
      const start = i;
      const end = i + compressed_size;
      // 4 bytes : compression type
      const key_block_type = new BufferList(key_block_compressed.slice(start, start + 4));
      // # 4 bytes : adler checksum of decompressed key block
      // adler32 = unpack('>I', key_block_compressed[start + 4:start + 8])[0]
      let key_block;
      if (key_block_type.toString("hex") == "00000000") {
        key_block = key_block_compressed.slice(start + 8, end);
      } else if (key_block_type.toString("hex") == "01000000") {
        // TODO lzo decompress
        // if lzo is None:
        //     print("LZO compression is not supported")
        //     break
        // # decompress key block
        const header = new ArrayBuffer([0xf0, decompressed_size]);
        const keyBlock = lzo1x.decompress(
          _appendBuffer(header, key_block_compressed.slice(start + 8, end)),
          decompressed_size, 1308672,
        );
        // lzo.decompress(_appendBuffer(header, key_block_compressed.slice(start + 8, end)));
        key_block = bufferToArrayBuffer(keyBlock)
          .slice(keyBlock.byteOffset, keyBlock.byteOffset + keyBlock.byteLength);
        // throw Error("lzo compress is not support yet");
      } else if (key_block_type.toString("hex") === "02000000") {
        // decompress key block
        key_block = pako.inflate(key_block_compressed.slice(start + 8, end));
        // extract one single key block into a key list
        // notice that adler32 returns signed value
        // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)
      } else {
        console.log(key_block_type.toString("hex"));
        throw Error("cannot determine the compress type");
      }

      const splitedKey = this._split_key_block(
        new BufferList(key_block),
        this._number_format, this._number_width, this._encoding,
      );
      key_list = key_list.concat(splitedKey);
      // append to a list
      // TODO
      keyBlocks.push(key_block);
      i += compressed_size;
    }
    // const dkbd04 = new Date().getTime();

    // seprate the decompress and decode
    // TODO promise all
    // const splitedKey = this._split_key_block(
    //   new BufferList(key_block),
    //   this._number_format, this._number_width, this._encoding,
    // );
    // TODO 这里修改为多线程版本
    // const promises = keyBlocks.map(async (key_block) => {
    //   const splitkeys = await
    // });
    // this._split_key_block_helper(keyBlocks, keyBlocks.length);

    // key_list = key_list.concat(splitedKey);

    // const dkbd05 = new Date().getTime();
    // console.log(`readKey#decodeKeyBlock#readOnce#loop#splitKey
    // used ${(dkbd05 - dkbd04) / 1000.0}s`);
    // key_list = key_list.concat(splitedKey);


    // const dkbd2 = new Date().getTime();
    // console.log(`readKey#decodeKeyBlock#readOnce used ${(dkbd2 - dkbd1) / 1000.0}s`);
    console.log(key_list.length);
    return key_list;
  }


  _decode_record_block() {
    const key_data = [];
    // current offset should equals record_block_offset
    assert(this.offset == this._record_block_offset, "record offset not equals to current file pointer");
    /**
     * decode the record block info section
     * [0:8/4]    - record blcok number
     * [8:16/4:8] - num entries the key-value entries number
     * [16:24/8:12] - record block info size
     * [24:32/32:40] - record block size
     */
    const num_record_blocks = this.__readnumber(this.__readfile(this._number_width));
    const num_entries = this.__readnumber(this.__readfile(this._number_width));
    assert(_numEqual(num_entries, this._num_entries));

    const record_block_info_size = this.__readnumber(this.__readfile(this._number_width));
    const record_block_size = this.__readnumber(this.__readfile(this._number_width));
    /**
     * record_block_info_list => record_block_info:
     * {
     *   1. compressed_size
     *   2. decompressed_size
     * }
     * Note: every record block will contrains a lot of entries
     */
    //  record block info section
    const record_block_info_list = [];
    let size_counter = new Long(0, 0);
    for (let i = 0; i < num_record_blocks; i++) {
      const compressed_size = this.__readnumber(this.__readfile(this._number_width));
      const decompressed_size = this.__readnumber(this.__readfile(this._number_width));
      record_block_info_list.push([compressed_size, decompressed_size]);
      size_counter = size_counter.add(this._number_width * 2);
    }
    assert(size_counter.eq(record_block_info_size));

    /**
     * start reading the record block
     */
    // # actual record block
    let offset = 0;
    let i = 0;
    size_counter = new Long(0, 0);
    let item_counter = new Long(0, 0);
    let record_offset = 0;
    // throw Error("ffff");
    for (let idx = 0; idx < record_block_info_list.length; idx++) {
      let comp_type = "none";
      const compressed_size = record_block_info_list[idx][0];
      const decompressed_size = record_block_info_list[idx][1];
      // console.log(compressed_size, decompressed_size);

      record_offset = this.offset;
      const record_block_compressed =
        new BufferList(this.__readfile(this.__toNumber(compressed_size)));
      // 4 bytes: compression type
      const record_block_type = new BufferList(record_block_compressed.slice(0, 4));
      // record_block stores the final record data
      let record_block;
      // Note: here ignore the checksum part
      // bytes: adler32 checksum of decompressed record block
      // adler32 = unpack('>I', record_block_compressed[4:8])[0]
      if (record_block_type.toString("hex") === "00000000") {
        record_block = record_block_compressed.slice(8, record_block_compressed.length);
      } else {
        let blockBufDecrypted = null;
        // if encrypt type == 1, the record block was encrypted
        if (this._encrypt === 1 /* || (this.ext == "mdd" && this._encrypt === 2 ) */) {
          // const passkey = new Uint8Array(8);
          // record_block_compressed.copy(passkey, 0, 4, 8);
          // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
          blockBufDecrypted =
            this.__mdx_decrypt(record_block_compressed);
        } else {
          blockBufDecrypted = record_block_compressed.slice(8, record_block_compressed.length);
        }
        if (record_block_type.toString("hex") === "01000000") {
          comp_type = "lzo";
          // throw Error("lzo not support yet!");
          // if (lzo is None){
          //     print("LZO compression is not supported")
          //     break
          // }

          // lzo decompress
          // python example:
          // header = b'\xf0' + pack('>I', decompressed_size)
          // record_block = lzo.decompress(record_block_compressed[start + 8:end],
          //  initSize = decompressed_size, blockSize=1308672)
          // console.log(compressed_size, decompressed_size, blockBufDecrypted.byteLength);

          // the header was need by lzo library, should append before real compressed data
          const header = new ArrayBuffer([0xf0, decompressed_size]);
          // Note: if use lzo, here will LZO_E_OUTPUT_RUNOVER, so ,use mini lzo js
          record_block =
            lzo1x.decompress(_appendBuffer(header, blockBufDecrypted), decompressed_size, 1308672);

          // lzo library decpmpress (failed)
          // record_block = lzo.decompress(_appendBuffer(header, blockBufDecrypted));
          // record_block = lzo.decompress(blockBufDecrypted);
          record_block = bufferToArrayBuffer(record_block)
            .slice(record_block.byteOffset, record_block.byteOffset + record_block.byteLength);
        } else if (record_block_type.toString("hex") === "02000000") {
          // console.log(record_block_type.toString("hex"));
          comp_type = "zlib";
          // zlib decompress
          record_block = pako.inflate(blockBufDecrypted);
        }
      }
      record_block = new BufferList(record_block);

      // # notice that adler32 return signed value
      // TODO: ignore the checksum
      // assert(adler32 == zlib.adler32(record_block) & 0xffffffff)
      // for debug
      // console.log(record_block.slice(0, 16));
      // console.log(record_block.length);
      // console.log(decompressed_size);

      assert(_numEqual(record_block.length, decompressed_size));
      // # split record block according to the offset info from key block
      /**
       * 请注意，block 是会有很多个的，而每个block都可能会被压缩
       * 而 key_list中的 record_start, key_text是相对每一个block而言的，end是需要每次解析的时候算出来的
       * 所有的record_start/length/end都是针对解压后的block而言的
       */
      while (i < this._key_list.length) {
        const record_start = this._key_list[i][0];
        const key_text = this._key_list[i][1];
        // # reach the end of current record block
        if (record_start - offset >= record_block.length) {
          break;
        }
        // # record end index
        let record_end;
        if (i < this._key_list.length - 1) {
          record_end = this._key_list[i + 1][0];
        } else {
          record_end = record_block.length + offset;
        }
        i += 1;
        // const data = record_block.slice(record_start - offset, record_end - offset);
        key_data.push({
          key: key_text,
          idx: item_counter.toNumber(),
          // data,
          encoding: this._encoding,
          // record_start,
          // record_end,
          record_idx: idx,
          record_comp_start: record_offset,
          record_compressed_size:
            Long.isLong(compressed_size) ? compressed_size.toNumber() : compressed_size,
          record_decompressed_size:
            Long.isLong(decompressed_size) ? decompressed_size.toNumber() : decompressed_size,
          record_comp_type: comp_type,
          record_encrypted: this._encrypt === 1,
          relateive_record_start: record_start - offset,
          relative_record_end: record_end - offset,
        });
        // console.log(key_text, this._decoder.decode(data));
        item_counter = item_counter.add(1);
      }
      offset += record_block.length;
      size_counter = size_counter.add(compressed_size);
    }

    // console.log(size_counter, record_block_size);
    assert(size_counter.eq(record_block_size));

    return key_data;
  }

  // Note: for performance, this function will wrappered by
  // a generator function, so this should return a Promise object
  _split_key_block(key_block, _number_format, _number_width, _encoding) {
    const key_list = [];
    let key_start_index = 0;
    let key_end_index = 0;

    while (key_start_index < key_block.length) {
      // const temp = key_block.slice(key_start_index, key_start_index + _number_width);
      // # the corresponding record's offset in record block
      const key_id = struct.unpack(
        _number_format,
        key_block.slice(key_start_index, key_start_index + _number_width),
      )[0];
      // # key text ends with '\x00'
      let delimiter;
      let width;
      if (_encoding == "UTF-16") {
        delimiter = "0000";
        width = 2;
      } else {
        delimiter = "00";
        width = 1;
      }
      let i = key_start_index + _number_width;
      while (i < key_block.length) {
        if (new BufferList(key_block.slice(i, i + width)).toString("hex") == delimiter) {
          key_end_index = i;
          break;
        }
        i += width;
      }
      const key_text =
    this._decoder.decode(key_block.slice(key_start_index + _number_width, key_end_index));

      key_start_index = key_end_index + width;
      key_list.push([key_id, key_text]);
    }
    return key_list;
  }

  _decode_key_block_info(num_key_blocks, key_info_bl, num_entries) {
    let key_block_info;
    if (this._version >= 2.0) {
      // zlib compression
      assert(
        key_info_bl.slice(0, 4).toString("hex") === "02000000",
        "the compress type zlib should start with 0x02000000",
      );
      let key_block_info_compressed;
      if (this._encrypt === 2) {
        key_block_info_compressed = this.__mdx_decrypt(key_info_bl);
      }
      // For version 2.0, will compress by zlib, lzo just just for 1.0
      // key_block_info_compressed[0:8] => compress_type
      key_block_info = new BufferList(pako.inflate(key_block_info_compressed.slice(
        8,
        key_block_info_compressed.length,
      )));
      // TODO: check the alder32 checksum
      // adler32 = unpack('>I', key_block_info_compressed[4:8])[0]
      // assert(adler32 == zlib.adler32(key_block_info) & 0xffffffff)
    } else {
      key_block_info = key_info_bl;
    }
    assert(_numEqual(this.header_info.key_block_info_decomp_size, key_block_info.length), "key_block_info length should equal");
    const key_block_info_list = [];

    let count_num_entries = new Long(0x00000000, 0x00000000);
    let byte_format = ">H";
    let byte_width = 2;
    let text_term = 1;
    if (this._version >= 2.0) {
      byte_format = ">H";
      byte_width = 2;
      text_term = 1;
    } else {
      byte_format = ">B";
      byte_width = 1;
      text_term = 0;
    }
    // while (i < key_block_info.length) {
    let count = 0;
    let i = 0;
    const key_block_num = Long.isLong(num_key_blocks) ? num_key_blocks.toNumber() : num_key_blocks;
    while (count < key_block_num) {
      // number of entries in current key block

      const tmp_count = struct.unpack(
        this._number_format,
        key_block_info.slice(i, i + this._number_width),
      )[0];
      count_num_entries = count_num_entries.add(tmp_count);
      i += this._number_width;

      const first_key_size = struct.unpack(byte_format, key_block_info.slice(i, i + byte_width))[0];
      i += byte_width;

      // step gap
      let step_gap = 0;
      // term_size is for first key and last key
      // let term_size = 0;
      if (this._encoding === UTF16) {
        step_gap = (first_key_size + text_term) * 2;
        // term_size = text_term * 2;
      } else {
        step_gap = first_key_size + text_term;
      }
      // TODO: ignore the first key
      // Note: key_block_first_key and last key not need to decode now
      // const key_block_first_key = key_block_info.slice(i, i + step_gap);
      // console.debug("key_block_first_key", this._decoder
      // .decode(key_block_first_key.slice(0, key_block_first_key.length - term_size)));
      i += step_gap;


      // text head
      // if (this._encoding != UTF16) {
      //   i += first_key_size + text_ter;
      // } else {
      //   i += (first_key_size + text_term) * 2;
      // }

      // text tail
      const keyblock_last_key_len = struct
        .unpack(byte_format, key_block_info.slice(i, i + byte_width))[0];
      i += byte_width;
      if (this._encoding === UTF16) {
        step_gap = (keyblock_last_key_len + text_term) * 2;
        // TODO: this is for last key output
        // term_size = text_term * 2;
      } else {
        step_gap = keyblock_last_key_len + text_term;
      }

      // Note: ignore the last key
      // const key_block_last_key = key_block_info.slice(i, i + step_gap);
      // console.log("key_block_last_key", this._decoder
      // .decode(key_block_last_key.slice(0, key_block_last_key.length - term_size)));
      i += step_gap;
      // key block compressed size
      const key_block_compressed_size = struct.unpack(
        this._number_format,
        key_block_info.slice(i, i + this._number_width),
      )[0];
      i += this._number_width;
      // key block decompressed size
      const key_block_decompressed_size = struct.unpack(
        this._number_format,
        key_block_info.slice(i, i + this._number_width),
      )[0];
      i += this._number_width;
      key_block_info_list.push([this.__toNumber(key_block_compressed_size),
        this.__toNumber(key_block_decompressed_size)]);
      // break;
      count += 1;
    }
    assert(count_num_entries.equals(num_entries), "the number_entries should equal the count_num_entries");
    return key_block_info_list;
  }


  //-----------------------
  //  assistant functions
  //-----------------------

  // def _mdx_decrypt(comp_block):
  //   key = ripemd128(comp_block[4:8] + pack(b'<L', 0x3695))
  //   return comp_block[0:8] + _fast_decrypt(comp_block[8:], key)

  __mdx_decrypt(comp_block) {
    const key = ripemd128.ripemd128(new BufferList(comp_block.slice(4, 8)).append(struct.pack("<L", 0x3695)).slice(0, 8));
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

  // readfile returns a BufferList object which can be easily to use slice method
  __readfile(length) {
    const b = readChunk.sync(this.fname, this.offset, length);
    this.offset += length;
    return new BufferList().append(b);
  }

  __readbuffer(start, length) {
    const buf = readChunk.sync(this.fname, start, length);
    return new BufferList(buf);
  }

  // skip those bytes, this is for checksum
  __skip_bytes(num) {
    this.offset += num;
  }

  // read number from buffer use number format,
  // note, you should calc the number length before use this method
  __readnumber(bf) {
    return struct.unpack(this._number_format, bf)[0];
  }
  __toNumber(number) {
    if (Long.isLong(number)) {
      return number.toNumber();
    }
    return number;
  }
}

export default MDict;
