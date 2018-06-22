import struct from "python-struct";
import readChunk from "read-chunk";
import hash from "mhash";
import assert from "assert";
import dart from "doublearray";
import Parser from "./Parser";
import common from "./common";
import { DOMParser } from "xmldom";
import BufferList from "bl";
import ripemd128 from "./ripemd128";
import pako from "pako";
import Long from "long";
import { TextDecoder } from "text-encoding";

const UTF_16LE_DECODER = new TextDecoder("utf-16le");
const UTF16 = "UTF-16";

const UTF_8_DECODER = new TextDecoder("utf-8");
const UTF8 = "UTF-8";


//-----------------------------
//        TOOL METHODS
//-----------------------------
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
  // below is regexp method, but not support new line regexp
  // const re = /(\w+)="(.*?)"/g;
  // let m;
  // do {
  //   m = re.exec(header_text);
  //   if (m) {
  //     console.log(`${m[1]} = "${m[2]}"`);
  //   }
  // } while (m);
}

class Mdict {
  constructor(dictPath) {
    this.dictPath = dictPath;
    this.ext = common.getExtension(dictPath, "mdx");
    this.parser = new Parser(this.dictPath, this.ext);
  }
  build() {
    return new Promise((_resolve, _reject) => {
      this.parser.parse().then((dict) => {
        this.trie = dart.builder()
          .build(dict.keyList
            .map(keyword => ({ k: this._adapt(keyword.key), v: keyword.offset })));
        this.recordTable = dict.recordBlockTable;
        this.buffer = dict.buffer;
        this.attributes = dict.headerAttributes;
        _resolve(this);
      }).catch(err => _reject(err));
    });
  }

  prefix(word) {
    if (!this.trie) {
      throw new Error("preSearch require use in promise after build");
    }
    return this.trie.commonPrefixSearch(word);
  }

  contain(word) {
    if (!this.trie) {
      throw new Error("contain require use in Promise after build");
    }
    return this.trie.contain(word);
  }

  lookup(word) {
    if (!this.trie) {
      throw new Error("contain require use in Promise after build");
    }
    if (!this.contain(word)) {
      return "NOT_FOUND";
    }
    const keyWordIndexOffset = this.trie.lookup(word);
    // TODO get more cooll readDefination method
    return this.parser
      .scanner.readDifination(this.buffer, this.recordTable
        .find(keyWordIndexOffset), keyWordIndexOffset);
  }

  attr() {
    if (!this.attributes) {
      throw new Error("attributes require use in Promise after build");
    }
    return this.attributes;
  }

  _adapt(key) {
    return this.parser.scanner._adaptKey(key);
  }
}

// export default Mdict;

// Mdict is the base class
// It has no public method just for extend by sub class
class Mdict2 {
  constructor(fname, _passcode) {
    this.fname = fname;
    this._offset = 0;
    this.ext = common.getExtension(fname, "mdx");
    this.header = this._read_header();
    this._key_list = this._read_keys();
    // console.log(this._key_list.length);
    this._passcode = _passcode;
    const key_data = this._decode_record_block();
    console.log(key_data);
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
    if (!this.header_info.Encrypted || this.header_info.Encrypted == "") {
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
    console.log(this.header_info);
    if (!this.header_info.Encoding || this.header_info.Encoding == "") {
      this._encoding = UTF8;
    } else if (this.header_info.Encoding == "GBK" || this.header_info.Encoding == "GB2312") {
      this._encoding = "GB18030";
    } else if (this.header_info.Encoding.toLowerCase() == "big5") {
      this._encoding = "BIG";
    } else {
      this._encoding =
      (this.header_info.Encoding.toLowerCase() == "utf16"
      || this.header_info.Encoding.toLowerCase() == "utf-16") ?
        UTF16 : UTF8;
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
    // console.log(num_key_blocks.toString());

    // number of entries
    const num_entries =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log(num_entries.toString());
    this._num_entries = num_entries;

    // number of key block info decompress size
    if (this._version >= 2.0) {
      const key_block_info_decomp_size =
      this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
      key_i_ofst += this._number_width;
      console.log(key_block_info_decomp_size.toString());
    }

    // number of key block info compress size
    const key_block_info_size =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log(key_block_info_size.toString());

    // number of key blocks total size, note, key blocks total size, not key block info
    const key_blocks_total_size =
    this.__readnumber(key_info_b.slice(key_i_ofst, key_i_ofst + this._number_width));
    key_i_ofst += this._number_width;
    // console.log(key_blocks_total_size.toString());

    // 4 bytes alder32 checksum, after key info block
    // TODO: skip for now, not support yet
    this.__skip_bytes(4);
    const key_block_info = this.__readfile(key_block_info_size.toNumber());
    const key_block_info_list = this._decode_key_block_info(key_block_info, num_entries);
    // assert(num_key_blocks == len(key_block_info_list))
    // console.log("num_key_blocks", num_key_blocks);
    // console.log("key_block_info_list", key_block_info_list.length);
    assert(num_key_blocks.toNumber() === key_block_info_list.length, "the num_key_info_list should equals to key_block_info_list");


    // key_block_compress part
    // ====================
    // key_block_compress
    // ====================
    // console.log("key_blocks_total_size", key_blocks_total_size);
    const key_block_compressed = new BufferList(this.__readfile(key_blocks_total_size.toNumber()));
    // console.log("key_block_info_list", key_block_info_list);
    const key_list = this._decode_key_block(key_block_compressed, key_block_info_list);
    // console.log("key_list", key_list);
    this._record_block_offset = this.offset;
    return key_list;
  }

  _decode_key_block(key_block_compressed, key_block_info_list) {
    // console.log(this._encoding);
    let key_list = [];
    let i = 0;
    for (let idx = 0; idx < key_block_info_list.length; idx++) {
      // console.log(" aaa", key_block_info_list[idx], idx);

      const compressed_size = key_block_info_list[idx][0];
      // const decompressed_size = key_block_info_list[idx][1];
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
        // console.log("mdict.js:318", decompressed_size);
        throw Error("lzo compress is not support yet");
        // if lzo is None:
        //     print("LZO compression is not supported")
        //     break
        // // # decompress key block
        // header = b'\xf0' + pack('>I', decompressed_size)
        // key_block = lzo.decompress(
        //   key_block_compressed[start + 8:end], initSize = decompressed_size, blockSize=1308672)
      } else if (key_block_type.toString("hex") === "02000000") {
        // decompress key block
        key_block = pako.inflate(key_block_compressed.slice(start + 8, end));
        // extract one single key block into a key list
        key_list = key_list.concat(this._split_key_block(
          new BufferList(key_block),
          this._number_format, this._number_width, this._encoding,
        ));
        // notice that adler32 returns signed value
        // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)

        i += compressed_size;
      } else {
        console.log(key_block_type.toString("hex"));
        throw Error("cannot determine the compress type");
      }
    }
    return key_list;
  }


  _decode_record_block() {
    const key_data = [];
    // f = open(self._fname, 'rb')
    // f.seek(self._record_block_offset)

    // current offset should equals record_block_offset
    assert(this.offset == this._record_block_offset, "record offset not equals to current file pointer");
    const num_record_blocks = this.__readnumber(this.__readfile(this._number_width));
    const num_entries = this.__readnumber(this.__readfile(this._number_width));
    // console.log(num_entries, this._num_entries);
    assert(num_entries.eq(this._num_entries), "num_entries should be equals");
    const record_block_info_size = this.__readnumber(this.__readfile(this._number_width));
    const record_block_size = this.__readnumber(this.__readfile(this._number_width));

    // # record block info section
    const record_block_info_list = [];
    let size_counter = new Long(0, 0);
    for (let i = 0; i < num_record_blocks; i++) {
      const compressed_size = this.__readnumber(this.__readfile(this._number_width));
      const decompressed_size = this.__readnumber(this.__readfile(this._number_width));
      record_block_info_list.push([compressed_size, decompressed_size]);
      size_counter = size_counter.add(this._number_width * 2);
    }
    assert(size_counter.eq(record_block_info_size));

    // # actual record block
    let offset = 0;
    let i = 0;
    size_counter = new Long(0, 0);
    for (let idx = 0; idx < record_block_info_list.length; idx++) {
      const compressed_size = record_block_info_list[idx][0];
      const decompressed_size = record_block_info_list[idx][1];

      const record_block_compressed = new BufferList(this.__readfile(compressed_size.toNumber()));
      // # 4 bytes: compression type
      const record_block_type = new BufferList(record_block_compressed.slice(0, 4));
      // record_block stores the acutally record data
      let record_block;
      // # 4 bytes: adler32 checksum of decompressed record block
      // adler32 = unpack('>I', record_block_compressed[4:8])[0]
      if (record_block_type.toString("hex") === "00000000") {
        record_block = record_block_compressed.slice(8, record_block_compressed.length);
      } else if (record_block_type.toString("hex") === "01000000") {
        throw Error("lzo not support yet!");
        // if (lzo is None){
        //     print("LZO compression is not supported")
        //     break
        // }
        // // # decompress
        // header = b'\xf0' + pack('>I', decompressed_size)
        // record_block = lzo.decompress(record_block_compressed[start + 8:end],
        //  initSize = decompressed_size, blockSize=1308672)
      } else if (record_block_type.toString("hex") === "02000000") {
        // # decompress
        record_block = pako.inflate(record_block_compressed.slice(
          8,
          record_block_compressed.length,
        ));
      }

      // # notice that adler32 return signed value
      // assert(adler32 == zlib.adler32(record_block) & 0xffffffff)

      assert(record_block.length == decompressed_size);
      // # split record block according to the offset info from key block
      // console.log(idx, i, this._key_list.length);
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
        const data = record_block.slice(record_start - offset, record_end - offset);
        key_data.push(key_text, data);
        // console.log(key_text, data.length);
      }
      offset += record_block.length;
      size_counter = size_counter.add(compressed_size);
    }

    // console.log(size_counter, record_block_size);
    assert(size_counter.eq(record_block_size));

    return key_data;
    // f.close()
  }

  _split_key_block(key_block, _number_format, _number_width, _encoding) {
    const key_list = [];
    let key_start_index = 0;
    let key_end_index = 0;
    // console.log(key_block.length, key_block);
    while (key_start_index < key_block.length) {
      // const temp = key_block.slice(key_start_index, key_start_index + _number_width);
      // # the corresponding record's offset in record block
      const key_id = struct.unpack(
        _number_format,
        key_block.slice(key_start_index, key_start_index + _number_width),
      )[0];
      // console.log("key_id", key_id);
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
      // console.log(i, key_start_index, _number_width, key_block.length);
      while (i < key_block.length) {
        if (new BufferList(key_block.slice(i, i + width)).toString("hex") == delimiter) {
          key_end_index = i;
          break;
        }
        i += width;
      }
      const key_text =
      UTF_8_DECODER.decode(key_block.slice(key_start_index + _number_width, key_end_index));

      key_start_index = key_end_index + width;
      key_list.push([key_id, key_text]);
    }
    return key_list;
  }

  _decode_key_block_info(key_info_bl, num_entries) {
    let key_block_info;
    if (this._version >= 2.0) {
      // zlib compression
      // console.log();
      assert(
        key_info_bl.slice(0, 4).toString("hex") === "02000000",
        "the compress type zlib should start with 0x02000000",
      );
      let key_block_info_compressed;
      if (this._encrypt === 2) {
        key_block_info_compressed = this.__mdx_decrypt(key_info_bl);
      }
      // console.log(key_block_info_compressed);
      key_block_info = new BufferList(pako.inflate(key_block_info_compressed.slice(
        8,
        key_block_info_compressed.length,
      )));
      // console.log("!!!", key_block_info.slice(8, 16));
      // TODO: check the alder32 checksum
      // adler32 = unpack('>I', key_block_info_compressed[4:8])[0]
      // assert(adler32 == zlib.adler32(key_block_info) & 0xffffffff)
    } else {
      key_block_info = key_info_bl;
    }
    const key_block_info_list = [];
    let count_num_entries = new Long(0x00000000, 0x00000000);
    let i = 0;
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
    // console.log(key_block_info.length);
    // console.log(this._number_width);
    // console.log(this._number_format);
    while (i < key_block_info.length) {
      // console.log("i", i);
      // number of entries in current key block
      const tmp_count = struct.unpack(
        this._number_format,
        key_block_info.slice(i, i + this._number_width),
      )[0];
      // console.log("tmpcount", tmp_count);
      count_num_entries = count_num_entries.add(tmp_count);
      i += this._number_width;
      // text head size
      // console.log("byte_width", byte_width);
      // console.log(key_block_info.slice(i, i + byte_width));
      const text_head_size = struct.unpack(byte_format, key_block_info.slice(i, i + byte_width))[0];
      // console.log("text_header_size", i, text_head_size, byte_format);
      i += byte_width;
      // text head

      if (this._encoding != "UTF-16") {
        i += text_head_size + text_term;
      } else {
        i += (text_head_size + text_term) * 2;
      }
      // text tail size
      // print('*'*20);
      // print("i: " , i)
      // print("byte format: " , byte_format)
      // print("byte width: " , byte_width)
      // print("key block info: " , key_block_info.slice(i,i + byte_width))
      // console.log("byte_width", i, byte_width);
      const text_tail_size = struct.unpack(byte_format, key_block_info.slice(i, i + byte_width))[0];
      i += byte_width;
      // text tail
      if (this._encoding != "UTF-16") {
        i += text_tail_size + text_term;
      } else {
        i += (text_tail_size + text_term) * 2;
      }
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
      key_block_info_list.push([key_block_compressed_size.toNumber(),
        key_block_decompressed_size.toNumber()]);
      // break;
    }
    // console.log(count_num_entries, num_entries);
    assert(count_num_entries.equals(num_entries), "the number_entries should equal the count_num_entries");
    return key_block_info_list;
  }

  //-----------------------
  //  assistant functions
  //-----------------------

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

  // skip those bytes, this is for checksum
  __skip_bytes(num) {
    this.offset += num;
  }

  // read number from buffer use number format,
  // note, you should calc the number length before use this method
  __readnumber(bf) {
    return struct.unpack(this._number_format, bf)[0];
  }
}


export default Mdict2;
