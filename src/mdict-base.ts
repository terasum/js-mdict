import assert from 'assert';
import lzo1x from './lzo1x-wrapper.js';
import common, { NumFmt } from './utils.js';
import { FileScanner } from './scanner.js';
import zlib from 'zlib';

const pako = {
  inflate: zlib.inflateSync,
};

const UTF_16LE_DECODER = new TextDecoder('utf-16le');
const UTF16 = 'UTF-16';

const UTF_8_DECODER = new TextDecoder('utf-8');
const UTF8 = 'UTF-8';

const BIG5_DECODER = new TextDecoder('big5');
const BIG5 = 'BIG5';

const GB18030_DECODER = new TextDecoder('gb18030');
const GB18030 = 'GB18030';

const BASE64ENCODER = function (arrayBuffer: Uint8Array): string {
  return Buffer.from(arrayBuffer).toString('base64');
};

export interface MDictOptions {
  passcode?: string;
  debug?: boolean;
  resort?: boolean;
  isStripKey?: boolean;
  isCaseSensitive?: boolean;
  encryptType?: number;
}

export interface MDictHeader {
  [key: string]: string | { [key: string]: string[] };
}

interface MdictDebugInfo {
  [key: string]: string | { [key: string]: string[] };
}

export interface KeyHeader {
  keyBlocksNum: number;
  entriesNum: number;
  keyBlockInfoDecompSize: number;
  keyBlockInfoCompSize: number;
  keyBlocksTotalSize: number;
}

export interface KeyBlockInfo {
  firstKey: string;
  lastKey: string;
  keyBlockCompSize: number;
  keyBlockCompAccumulator: number;
  keyBlockDecompSize: number;
  keyBlockDecompAccumulator: number;
  keyBlockEntriesNum: number;
  keyBlockEntriesAccumulator: number;
  keyBlockIndex: number;
}

export interface RecordHeader {
  recordBlocksNum: number;
  entriesNum: number;
  recordBlockInfoCompSize: number;
  recordBlockCompSize: number;
}

export interface RecordBlockInfo {
  compSize: number;
  compAccumulator: number;
  decompSize: number;
  decompAccumulator: number;
}

export interface KeyListItem {
  recordStartOffset: number;
  keyText: string;
  keyBlockIdx: number;
  original_idx?: number;
  nextRecordStartOffset?: number;
}

export interface KeyRecord {
  keyText: string;
  recordStartOffset: number;
  recordOffset?: number;
  rofset?: number;
  nextRecordStartOffset?: number;
  original_idx?: number;
}

export class MdictMeta {
  fname: string = "";
  // mdx 密码
  passcode?: string = "";
  // ext 文件后缀
  ext: string = "mdx";
  // mdx version
  version: number = 2.0;
  // num width
  numWidth: number = 4;
  // num format
  numFmt: NumFmt = common.NUMFMT_UINT32 as NumFmt;
  // encoding 编码
  encoding: string = "";
  // decoder 解码器
  decoder: TextDecoder = new TextDecoder();
  // 是否加密
  encrypt: number = 0
  // encrypt key
  encrypt_key?: Uint8Array;

}

/**
 * @class MdictBase, the basic mdict diction parser class
 * @brif
 * STEPS:
 * 1. read mdict file header
 * 2. read key header
 * 3. read key block info
 * 4. read key block
 * 5. read record header
 * 6. read record block
 *
 * 词典结构包括如下部分:
 *
 * Header     : 记录词典的meta信息，包括名称、描述、样式、编码方式等
 * KeyInfo    : 记录词典的Key排列信息，设计用于索引
 * KeyBlock   : 记录词典的所有key列表信息，可以在 key block 中得到本词典的所有词条
 * RecordInfo : 记录词典的所有record词条释义信息，可以加速检索
 * RecordBlock: 记录词典的所有record词条释义，如果是mdd文件，则为二进制图片、音频等
 *
 * @return {MDict}
 */
class MDictBase {
  // 文件扫描
  scanner: FileScanner;

  // mdx meta
  meta: MdictMeta = new MdictMeta();

  // debug info
  debugInfo: MdictDebugInfo = {};

  // options 读取选项
  options: MDictOptions;

  // -------------------------
  // PART1: header
  // -------------------------

  // header 开始偏移
  _headerStartOffset: number;
  // header 结束偏移
  _headerEndOffset: number;
  // header 数据
  header: MDictHeader;

  // ------------------------
  // PART2: keyHeader
  // ------------------------

  // keyHeader 开始偏移
  _keyHeaderStartOffset: number;
  // keyHeader 结束偏移
  _keyHeaderEndOffset: number;
  // keyHeader 数据
  keyHeader: KeyHeader;

  // ------------------------
  // PART2: keyBlockInfo
  // ------------------------
  // keyBlockInfo 开始偏移
  _keyBlockInfoStartOffset: number;
  // keyBlockInfo 结束偏移
  _keyBlockInfoEndOffset: number;
  // keyBlockInfo 数据 (Key Block Info list)
  keyBlockInfoList: KeyBlockInfo[];

  // ------------------------
  // PART2: keyBlock
  // ------------------------

  // keyBlock 开始偏移
  _keyBlockStartOffset: number;
  // keyBlock 结束偏移
  _keyBlockEndOffset: number;
  // keyList 数据(词条列表)
  keyList: KeyListItem[];


  // ------------------------
  // PART2: recordHeader
  // ------------------------

  // recordHeader 开始偏移
  _recordHeaderStartOffset: number;
  // recordHeader 结束偏移
  _recordHeaderEndOffset: number;
  // recordHeader 数据
  recordHeader: RecordHeader;

  // ------------------------
  // PART2: recordBlockInfo
  // ------------------------
  // recordInfo 开始偏移
  _recordBlockInfoStartOffset: number;
  // recordInfo 结束偏移
  _recordBlockInfoEndOffset: number;
  // recordBlockInfo 数据
  recordBlockInfoList: RecordBlockInfo[];

  // ------------------------
  // PART2: recordBlock
  // ------------------------
  // recordBlock 开始偏移
  _recordBlockStartOffset: number;
  // recordBlock 结束偏移
  _recordBlockEndOffset: number;
  // keyData 数据
  recordBlockDataList: any[];

  /**
   * mdict constructor
   * @param {string} fname
   * @param {string} passcode
   */
  constructor(fname: string, passcode?: string, options?: Partial<MDictOptions>) {
    // the mdict file name
    this.meta.fname = fname;
    // the dictionary file decrypt pass code
    this.meta.passcode = passcode;
    // the dictionary file extension
    this.meta.ext = common.getExtension(fname, 'mdx');
    // the file scanner
    this.scanner = new FileScanner(fname);

    // set options
    this.options = options ?? {
      passcode: passcode,
      debug: false,
      resort: true,
      isStripKey: true,
      isCaseSensitive: false,
      encryptType: -1,
    };

    // # decrypt regcode to get the encrypted key
    // TODO implements passcode decrypt part
    if (passcode) {
      // const {regcode, userid} = passcode
      // if isinstance(userid, unicode):
      //     userid = userid.encode('utf8')
      // self._encrypted_key = _decrypt_regcode_by_userid(regcode, userid)
    } else if (this.meta.version >= 3.0) {
      // uuid = self.header.get(b'UUID')
      // if uuid:
      //     if xxhash is None:
      //         raise RuntimeError('xxhash module is needed to read MDict 3.0 format')
      //     mid = (len(uuid) + 1) // 2
      //     self._encrypted_key = xxhash.xxh64_digest(uuid[:mid]) + xxhash.xxh64_digest(uuid[mid:])
    }

    // -------------------------
    // dict header section
    //--------------------------
    // read the diction header info
    this._headerStartOffset = 0;
    this._headerEndOffset = 0;
    this.header = {};

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

    // -------------------------
    // dict key info section
    // --------------------------
    this._keyBlockInfoStartOffset = 0;
    this._keyBlockInfoEndOffset = 0;
    // key block info list
    this.keyBlockInfoList = [];

    // -------------------------
    // dict key block section
    // --------------------------
    this._keyBlockStartOffset = 0;
    this._keyBlockEndOffset = 0;
    this.keyList = [];

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

    // -------------------------
    // dict record info section
    // --------------------------
    this._recordBlockInfoStartOffset = 0;
    this._recordBlockInfoEndOffset = 0;
    this.recordBlockInfoList = [];

    // -------------------------
    // dict record block section
    // --------------------------
    this._recordBlockStartOffset = 0;
    this._recordBlockEndOffset = 0;
    this.recordBlockDataList = [];

    this._readDict();
  }

  _readDict() {
    let startTime = new Date().getTime();
    this._readHeader();
    if (this.options.debug) {
      console.log('readHeader finished', { header: this.header, timeCost: new Date().getTime() - startTime });
    }

    startTime = new Date().getTime();
    this._readKeyHeader();
    if (this.options.debug) {
      console.log('readKeyHeader finished', { keyHeader: this.keyHeader, timeCost: new Date().getTime() - startTime });
    }

    startTime = new Date().getTime();
    this._readKeyBlockInfo();
    if (this.options.debug) {
      const tempKeyBlockInfoList = this.keyBlockInfoList.slice(0, 10);
      console.log('readKeyBlockInfo finished', {
        keyBlockInfoList_0_10: tempKeyBlockInfoList,
        timeCost: new Date().getTime() - startTime,
      });
    }

    startTime = new Date().getTime();
    // @depreciated
    // _readKeyBlock method is very slow, avoid invoke dirctly
    // this method will return the whole words list of the dictionaries file, this is very slow
    // NOTE: 本方法非常缓慢，也有可能导致内存溢出，请不要直接调用
    this._readKeyBlock();

    if (this.options.debug) {
      console.log('_readKeyBlock finished', {
        keyListTop10: this.keyList.slice(0, 10),
        timeCost: new Date().getTime() - startTime,
      });
    }

    // @depreciated
    // 因为mdx的索引存在排序问题，很多词条无法通过key-info检索到，原本计划将词条全部读取出来再重排序
    // because the MDX's index has order issue, lots of words cannot be found by key-info
    // so we have to read all words and resort them. However, it often causes memory overflow and
    // very slow, so we have to avoid it.
    // this._decodeKeyBlock();
    // this._resortKeyList();

    startTime = new Date().getTime();
    this._readRecordHeader();
    if (this.options.debug) {
      console.log('_readRecordHeader finished', {
        timeCost: new Date().getTime() - startTime,
      });
    }

    startTime = new Date().getTime();
    this._readRecordInfo();
    if (this.options.debug) {
      console.log('_readRecordInfo finished', {
        timeCost: new Date().getTime() - startTime,
      });
    }

    // decodeRecordBlock method is very slow, avoid invoke dirctly
    // this method will return the whole words list of the dictionaries file, this is very slow
    // operation, and you should do this background, or concurrently.
    // decodeRecordBlock() 非常缓慢，不要直接调用
    startTime = new Date().getTime();
    this._readRecordBlock();
    if (this.options.debug) {
      console.debug('_readRecordBlock finished', {
        timeCost: new Date().getTime() - startTime,
      });
    }
  }

  /**
   * STEP 1. read dictionary header
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
    const headerByteSizeDv = this.scanner.readNumber(0, 4);
    const headerByteSize = headerByteSizeDv.getUint32(0);
    // [4:header_byte_size + 4] header_bytes
    const headerBuffer = this.scanner.readBuffer(4, headerByteSize);

    if (this.options.debug) {
      this.debugInfo.headerSize = `|size(4B)|meta($sizeB)|alder32(4B)|\n|${headerByteSize}|${headerBuffer.length}|4|`;
    }


    // TODO: SKIP 4 bytes alder32 checksum
    // header_b_cksum should skip for now, because cannot get alder32 sum by js
    // const header_b_cksum = readChunk.sync(this.meta.fname, header_byte_size + 4, 4);
    // assert(header_b_cksum), "header_bytes checksum failed");

    // 4 bytes header size + header_bytes_size + 4bytes alder checksum
    this._headerEndOffset = headerByteSize + 4 + 4;
    this._keyHeaderStartOffset = headerByteSize + 4 + 4;


    // header text in utf-16 encoding ending with `\x00\x00`, so minus 2
    // const headerText = common.readUTF16(headerBuffer, 0, headerByteSize - 2);
    const headerText = UTF_16LE_DECODER.decode(headerBuffer);

    // parse header info
    Object.assign(this.header, common.parseHeader(headerText));

    // set header default configuration
    this.header.KeyCaseSensitive = this.header.KeyCaseSensitive || 'No';
    this.header.StripKey = this.header.StripKey || 'Yes';

    // encrypted flag
    // 0x00 - no encryption
    // 0x01 - encrypt record block
    // 0x02 - encrypt key info block
    if (!this.header.Encrypted || this.header.Encrypted == '' || this.header.Encrypted == 'No') {
      this.meta.encrypt = 0;
    } else if (this.header.Encrypted == 'Yes') {
      this.meta.encrypt = 1;
    } else {
      this.meta.encrypt = parseInt(this.header['Encrypted'] as string, 10);
    }

    if (this.options.encryptType && this.options.encryptType != -1) {
      this.meta.encrypt = this.options.encryptType;
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
    this.meta.version = parseFloat(this.header['GeneratedByEngineVersion'] as string);
    if (this.meta.version >= 2.0) {
      this.meta.numWidth = 8;
      this.meta.numFmt = common.NUMFMT_UINT64 as NumFmt;
    } else {
      this.meta.numWidth = 4;
      this.meta.numFmt = common.NUMFMT_UINT32 as NumFmt;
    }
    if (!this.header.Encoding || this.header.Encoding == '') {
      this.meta.encoding = UTF8;
      this.meta.decoder = UTF_8_DECODER;
    } else if (this.header.Encoding == 'GBK' || this.header.Encoding == 'GB2312') {
      this.meta.encoding = GB18030;
      this.meta.decoder = GB18030_DECODER;
    } else if ((this.header['Encoding'] as string).toLowerCase() == 'big5') {
      this.meta.encoding = BIG5;
      this.meta.decoder = BIG5_DECODER;
    } else {
      this.meta.encoding =
        (this.header['Encoding'] as string).toLowerCase() == 'utf16' ||
          (this.header['Encoding'] as string).toLowerCase() == 'utf-16'
          ? UTF16
          : UTF8;
      if (this.meta.encoding == UTF16) {
        this.meta.decoder = UTF_16LE_DECODER;
      } else {
        this.meta.decoder = UTF_8_DECODER;
      }
    }
    // determine the encoding and decoder, if extension is *.mdd
    if (this.meta.ext === 'mdd') {
      this.meta.encoding = UTF16;
      this.meta.decoder = UTF_16LE_DECODER;
    }
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
    const bytesNum = this.meta.version >= 2.0 ? 8 * 5 : 4 * 4;
    // const keyHeaderBuff = this._readBuffer(this._keyHeaderStartOffset, bytesNum);
    const keyHeaderBuff = this.scanner.readBuffer(this._keyHeaderStartOffset, bytesNum);

    // decrypt
    if (this.meta.encrypt & 1) {
      if (!this.meta.passcode || this.meta.passcode == '') {
        // TODO: encrypted file not support yet
        throw Error(' user identification is needed to read encrypted file');
      }
      // regcode, userid = header_info['_passcode']
      if (this.header.RegisterBy == 'Email') {
        // encrypted_key = _decrypt_regcode_by_email(regcode, userid);
        throw Error('encrypted file not support yet');
      } else {
        throw Error('encrypted file not support yet');
      }
    }

    let offset = 0;
    // [0:8]   - number of key blocks
    const keyBlockNumBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
    this.keyHeader.keyBlocksNum = this._readNumber(keyBlockNumBuff);
    offset += this.meta.numWidth;

    // [8:16]  - number of entries
    const entriesNumBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
    this.keyHeader.entriesNum = this._readNumber(entriesNumBuff);
    offset += this.meta.numWidth;

    // [16:24] - number of key block info decompress size
    if (this.meta.version >= 2.0) {
      // only for version > 2.0
      const keyBlockInfoDecompBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
      const keyBlockInfoDecompSize = this._readNumber(keyBlockInfoDecompBuff) as number;
      offset += this.meta.numWidth;
      // console.log(key_block_info_decomp_size.toString());
      this.keyHeader.keyBlockInfoDecompSize = keyBlockInfoDecompSize;
    }

    // [24:32] - number of key block info compress size
    const keyBlockInfoSizeBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
    const keyBlockInfoSize = this._readNumber(keyBlockInfoSizeBuff) as number;
    offset += this.meta.numWidth;
    // console.log("key_block_info_size", key_block_info_size.toString());
    this.keyHeader.keyBlockInfoCompSize = keyBlockInfoSize;

    // [32:40] - number of key blocks total size, note, key blocks total size, not key block info
    const keyBlocksTotalSizeBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
    const keyBlocksTotalSize = this._readNumber(keyBlocksTotalSizeBuff) as number;
    offset += this.meta.numWidth;
    // console.log(key_blocks_total_size.toString());
    this.keyHeader.keyBlocksTotalSize = keyBlocksTotalSize;

    // 4 bytes alder32 checksum, after key info block (only >= v2.0)
    // set end offset
    this._keyHeaderEndOffset = this._keyHeaderStartOffset +
      bytesNum + (this.meta.version >= 2.0 ? 4 : 0); /* 4 bytes adler32 checksum length, only for version >= 2.0 */
  }

  /**
   * STEP 3. read key block info, if you want quick search, read at here already enough
   * read key block info
   * key block info list
   */
  _readKeyBlockInfo() {
    this._keyBlockInfoStartOffset = this._keyHeaderEndOffset;
    const keyBlockInfoBuff = this.scanner.readBuffer(this._keyBlockInfoStartOffset, this.keyHeader.keyBlockInfoCompSize);
    if (this.options.debug) {
      this.debugInfo.keyBlockInfoBuffLen = keyBlockInfoBuff.length + "";
    }

    const keyBlockInfoList = this._decodeKeyBlockInfo(keyBlockInfoBuff);

    this._keyBlockInfoEndOffset = this._keyBlockInfoStartOffset + this.keyHeader.keyBlockInfoCompSize;
    assert(
      this.keyHeader.keyBlocksNum === keyBlockInfoList.length,
      'the num_key_info_list should equals to key_block_info_list'
    );

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
  _decodeKeyBlockInfo(keyBlockInfoBuff: Uint8Array): KeyBlockInfo[] {
    const keyBlockNum = this.keyHeader.keyBlocksNum;
    const numEntries = this.keyHeader.entriesNum;
    let kbInfoBuff: Uint8Array;
    if (this.meta.version >= 2.0) {
      const compressType = keyBlockInfoBuff.subarray(0, 4).join("");
      // zlib compression
      assert(
        compressType === "2000",
        'the compress type zlib should start with 0x02000000'
      );
      let kbInfoCompBuff: Uint8Array = keyBlockInfoBuff;
      if (this.meta.encrypt === 2) {
        kbInfoCompBuff = common.mdxDecrypt(keyBlockInfoBuff);
      }

      // For version 2.0, will compress by zlib, lzo just just for 1.0
      // key_block_info_compressed[0:8] => compress_type
      const rawData = zlib.inflateSync(kbInfoCompBuff.slice(8));
      kbInfoBuff = new Uint8Array(rawData);

      // TODO: check the alder32 checksum
      // adler32 = unpack('>I', key_block_info_compressed[4:8])[0]
      // assert(adler32 == zlib.adler32(key_block_info) & 0xffffffff)

      // this.keyHeader.keyBlockInfoDecompSize only exist when version >= 2.0
      assert(
        this.keyHeader.keyBlockInfoDecompSize == kbInfoBuff.length,
        `key_block_info decompress size ${this.keyHeader.keyBlockInfoDecompSize} should equal to keyblock info buffer length ${kbInfoBuff.length}`
      );
    } else {
      kbInfoBuff = keyBlockInfoBuff;
    }

    const keyBlockInfoList: KeyBlockInfo[] = [];

    // init tmp variables
    let countEntriesNum = 0;

    let kbCount = 0;
    let indexOffset = 0;

    let kbCompSizeAccu = 0;
    let kbDeCompSizeAccu = 0;
    while (kbCount < keyBlockNum) {
      let blockWordCount = 0;
      let firstWordBuffer: Uint8Array;
      let lastWordBuffer: Uint8Array;
      let packSize = 0;
      let unpackSize = 0;
      let firstWordSize = 0;
      let lastWordSize = 0;
      let firstKey = "";
      let lastKey = "";

      if (this.meta.version >= 2.0) {


        blockWordCount = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 8), false, common.NUMFMT_UINT64 as NumFmt) as number;

        firstWordSize = this._readNumber(kbInfoBuff.slice(indexOffset + 8, indexOffset + 10), false, common.NUMFMT_UINT16 as NumFmt) as number;
        if (this.meta.encoding === UTF16 || this.meta.ext === 'mdd') {
          firstWordSize = (firstWordSize + 1) * 2
        }
        firstWordBuffer = kbInfoBuff.slice(indexOffset + 10, indexOffset + 10 + firstWordSize);
        indexOffset += 10 + firstWordSize;

        lastWordSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 2), false, common.NUMFMT_UINT16 as NumFmt) as number;
        lastWordSize = (lastWordSize + 1) * 2
        lastWordBuffer = kbInfoBuff.slice(indexOffset + 2, indexOffset + 2 + lastWordSize);
        indexOffset += 2 + lastWordSize;

        packSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 8), false, common.NUMFMT_UINT64 as NumFmt) as number;
        unpackSize = this._readNumber(kbInfoBuff.slice(indexOffset + 8, indexOffset + 16), false, common.NUMFMT_UINT64 as NumFmt) as number;
        indexOffset += 16;
        firstKey = this.meta.decoder.decode(firstWordBuffer);
        lastKey = this.meta.decoder.decode(lastWordBuffer);
        // console.log(firstKey, lastKey)
      } else if (this.meta.version == 1.2) {

        blockWordCount = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 4), false, common.NUMFMT_UINT32 as NumFmt) as number;

        firstWordSize = this._readNumber(kbInfoBuff.slice(indexOffset + 4, indexOffset + 5), false, common.NUMFMT_UINT8 as NumFmt) as number;
        firstWordSize = firstWordSize + 1

        firstWordBuffer = kbInfoBuff.slice(indexOffset + 5, indexOffset + 5 + firstWordSize);
        indexOffset += 5 + firstWordSize;

        lastWordSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 1), false, common.NUMFMT_UINT8 as NumFmt) as number;
        lastWordSize = lastWordSize + 1

        lastWordBuffer = kbInfoBuff.slice(indexOffset + 1, indexOffset + 1 + lastWordSize);
        indexOffset += 1 + lastWordSize;

        packSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 4), false, common.NUMFMT_UINT32 as NumFmt) as number;
        unpackSize = this._readNumber(kbInfoBuff.slice(indexOffset + 4, indexOffset + 8), false, common.NUMFMT_UINT32 as NumFmt) as number;
        indexOffset += 8;
        firstKey = this.meta.decoder.decode(firstWordBuffer);
        lastKey = this.meta.decoder.decode(lastWordBuffer);
      }

      keyBlockInfoList.push({
        firstKey,
        lastKey,
        keyBlockCompSize: packSize,
        keyBlockCompAccumulator: kbCompSizeAccu,
        keyBlockDecompSize: unpackSize,
        keyBlockDecompAccumulator: kbDeCompSizeAccu,
        keyBlockEntriesNum: blockWordCount,
        keyBlockEntriesAccumulator: countEntriesNum,
        keyBlockIndex: kbCount,
      });

      kbCount += 1; // key block number
      countEntriesNum += blockWordCount;
      kbCompSizeAccu += packSize;
      kbDeCompSizeAccu += unpackSize;
    }
    assert(
      countEntriesNum === numEntries,
      `the number_entries ${numEntries} should equal the count_num_entries ${countEntriesNum}`
    );
    assert(kbCompSizeAccu === this.keyHeader.keyBlocksTotalSize);
    return keyBlockInfoList;
  }

  /**
   * reduce word find the nearest key block
   * @param {string} phrase searching phrase
   * @param {function} stripfunc strip key string to compare
   */
  _reduceWordKeyBlock(
    phrase: string,
    _s?: (word: string) => string,
    compareFn?: (a: string, b: string) => number
  ): number {
    if (phrase == '') {
      return -1;
    }
    if (!compareFn) {
      compareFn = (a: string, b: string) => a.localeCompare(b);
    }
    if (!_s || _s == undefined) {
      // eslint-disable-next-line
      _s = (word: string) => {
        return word;
      };
    }
    let left = 0;
    let right = this.keyBlockInfoList.length - 1;
    let mid = 0;

    // when compare the word, the uppercase words are less than lowercase words
    // so we compare with the greater symbol is wrong, we needs to use the `common.wordCompare` function
    while (left <= right) {
      mid = left + ((right - left) >> 1);
      if (
        compareFn(_s(phrase), _s(this.keyBlockInfoList[mid].firstKey)) >= 0 &&
        compareFn(_s(phrase), _s(this.keyBlockInfoList[mid].lastKey)) <= 0
      ) {
        return mid;
      } else if (compareFn(_s(phrase), _s(this.keyBlockInfoList[mid].lastKey)) >= 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    // if (left >= this.keyBlockInfoList.length) {
    //   return -1;
    // }
    return -1;
  }

  /**
   * STEP 5. decode key block
   * decode key block return the total keys list,
   * Note: this method runs very slow, please do not use this unless special target
   */
  _readKeyBlock() {

    this._keyBlockStartOffset = this._keyBlockInfoEndOffset;
    // const kbCompBuff = this.scanner.readBuffer(this._keyBlockStartOffset, this.keyHeader.keyBlocksTotalSize);


    let keyList: KeyListItem[] = [];
    let kbStartOffset = this._keyBlockStartOffset;
    // if (this.options.debug) {
    //   console.log('_decodeKeyBlock', 'start decode key block', {
    //     keyBlocksTotalSize: this.keyHeader.keyBlocksTotalSize,
    //     kbCompBuff: kbCompBuff.subarray(0, 100),
    //     keyBlockInfoListLength: this.keyBlockInfoList.length,
    //   });
    // }


    // harvest keyblocks
    for (let idx = 0; idx < this.keyBlockInfoList.length; idx++) {
      const compSize = this.keyBlockInfoList[idx].keyBlockCompSize;
      const decompressedSize = this.keyBlockInfoList[idx].keyBlockDecompSize;

      const start = kbStartOffset;
      assert(start === this.keyBlockInfoList[idx].keyBlockCompAccumulator + this._keyBlockStartOffset, 'should be equal');

      // const end = kbStartOffset + compSize;
      const kbCompBuff = this.scanner.readBuffer(start, compSize);

      const keyBlock = this._decodeAndDecompressBlock(kbCompBuff, decompressedSize);

      const splitedKey = this._splitKeyBlock(Buffer.from(keyBlock), idx);
      keyList = keyList.concat(splitedKey);
      kbStartOffset += compSize;
    }
    assert(
      keyList.length === this.keyHeader.entriesNum,
      `key list length: ${keyList.length} should equal to key entries num: ${this.keyHeader.entriesNum}`
    );
    this._keyBlockEndOffset = this._keyBlockStartOffset + this.keyHeader.keyBlocksTotalSize;

    // keep keylist in memory
    this.keyList = keyList;

  }

  _decodeAndDecompressBlock(kbCompBuff: Uint8Array, decompressedSize: number) {
    //  4 bytes : compression type
    const kbCompType = Buffer.from(kbCompBuff.subarray(0, 4));

    // TODO 4 bytes adler32 checksum
    // # 4 bytes : adler checksum of decompressed key block
    // adler32 = unpack('>I', key_block_compressed[start + 4:start + 8])[0]

    let key_block: Uint8Array;
    if (kbCompType.toString('hex') == '00000000') {
      key_block = kbCompBuff.subarray(8);
    } else if (kbCompType.toString('hex') == '01000000') {
      // # 解压缩键块
      // TODO: test for v2.0 dictionary
      // const header = new Uint8Array([0xf0, decompressedSize]);
      // const combinedKbCompressedBuff = common.appendBuffer(header, kbCompBuff.subarray(8));
      const combinedKbCompressedBuff = kbCompBuff.subarray(8);

      const keyBlock = lzo1x.decompress(
        combinedKbCompressedBuff,
        decompressedSize,
        0 //  TODO ignore the init size
      );

      key_block = Buffer.from(keyBlock);
    } else if (kbCompType.toString('hex') === '02000000') {
      // decompress key block
      key_block = Buffer.from(pako.inflate(kbCompBuff.subarray(8)));
      // extract one single key block into a key list
      // notice that adler32 returns signed value
      // TODO compare with privious word
      // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)
    } else {
      throw Error(`cannot determine the compress type: ${kbCompType.toString('hex')}`);
    }

    return key_block;

    // //  adler checksum of the block data used as the encryption key if none given
    // // const  adler32 = unpack('>I', block[4:8])[0]

    // let encrypted_key = this.meta.encrypt_key;
    // if (!encrypted_key) {
    //   encrypted_key = common.ripemd128(blockData.subarray(4, 8));
    // }

    // // block data
    // const data = blockData.subarray(8);
    // let decrypted_block: Buffer;

    // // decrypt
    // if (encryption_method == 0) {
    //   decrypted_block = data;
    // } else if (encryption_method == 1) {
    //   decrypted_block = common.appendBuffer(
    //     common.fast_decrypt(blockData.subarray(0, encryption_size), Buffer.from(encrypted_key)),
    //     blockData.subarray(encryption_size)
    //   );
    // } else if (encryption_method == 2) {
    //   decrypted_block = common.appendBuffer(
    //     common.salsa_decrypt(blockData.subarray(0, encryption_size), Buffer.from(encrypted_key)),
    //     blockData.subarray(encryption_size)
    //   );
    // } else {
    //   throw new Error(`encryption method %d not supported ${encryption_method}`);
    // }
  }

  /**
   * decode key block by key block id (from key info list)
   * @param {*} kbid key block id
   */
  _decodeKeyBlockByKBID(kbid: number): KeyListItem[] {
    this._keyBlockStartOffset = this._keyBlockInfoEndOffset;
    const compSize = this.keyBlockInfoList[kbid].keyBlockCompSize;
    const decompSize = this.keyBlockInfoList[kbid].keyBlockDecompSize;
    const startOffset = this.keyBlockInfoList[kbid].keyBlockCompAccumulator + this._keyBlockStartOffset;
    const kbCompBuff = this.scanner.readBuffer(startOffset, compSize);
    const start = 0;
    const end = compSize;
    // const kbCompType = Buffer.from(kbCompBuff.subarray(start, start + 4));
    // TODO 4 bytes adler32 checksum
    // # 4 bytes : adler checksum of decompressed key block
    // adler32 = unpack('>I', key_block_compressed[start + 4:start + 8])[0]

    // let key_block: Buffer;
    // if (kbCompType.toString('hex') == '00000000') {
    //   key_block = kbCompBuff.subarray(start + 8, end);
    // } else if (kbCompType.toString('hex') == '01000000') {
    //   // # decompress key block
    //   const keyBlock = lzo1x.decompress(kbCompBuff.subarray(start + 8, end), decompSize, 1308672);

    //   key_block = Buffer.from(keyBlock).subarray(keyBlock.byteOffset, keyBlock.byteOffset + keyBlock.byteLength);
    // } else if (kbCompType.toString('hex') === '02000000') {
    //   // decompress key block
    //   key_block = Buffer.from(pako.inflate(kbCompBuff.slice(start + 8, end)));
    //   // extract one single key block into a key list
    //   // notice that adler32 returns signed value
    //   // TODO compare with privious word
    //   // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)
    // } else {
    //   throw Error(`cannot determine the compress type: ${kbCompType.toString('hex')}`);

    // }
    const key_block = this._decodeAndDecompressBlock(kbCompBuff.subarray(start, end), decompSize);

    const splitedKey = this._splitKeyBlock(Buffer.from(key_block), kbid);
    return splitedKey;
  }

  /**
   * STEP 6. split keys from key block
   * split key from key block buffer
   * @param {Buffer} keyBlock key block buffer
   */
  _splitKeyBlock(keyBlock: Buffer, keyBlockIdx: number): KeyListItem[] {
    let width: number = this.meta.encoding == 'UTF-16' || this.meta.ext == 'mdd' ? 2 : 1;
    const keyList: KeyListItem[] = [];

    // because 0-7 is the leading number, we starts at keyblock[7]
    let keyStartIndex = 0;
    while (keyStartIndex < keyBlock.length) {
      const meaningOffset = this._readNumber(keyBlock.subarray(keyStartIndex, keyStartIndex + this.meta.numWidth), false, common.NUMFMT_UINT64 as NumFmt) as number;
      // const keyId = common.readNumber(keyBlock.subarray(keyStartIndex, keyStartIndex + this.meta.numWidth), this.meta.numFmt);

      let keyEndIndex = -1;

      let i = keyStartIndex + 8;
      while (i < keyBlock.length) {
        if ((width === 1 && keyBlock[i] == 0) || (width === 2 && keyBlock[i] == 0 && keyBlock[i + 1] == 0)) {
          keyEndIndex = i;
          break;
        }
        i += width;
      }

      if (keyEndIndex == -1) {
        break;
      }
      const keyTextBuffer = keyBlock.subarray(keyStartIndex + this.meta.numWidth, keyEndIndex);
      const keyText = this.meta.decoder.decode(keyTextBuffer);
      // const keyTextUTF8 = UTF_8_DECODER.decode(keyTextBuffer);
      // console.log(keyTextUTF8);
      keyList.push({ recordStartOffset: meaningOffset, keyText, keyBlockIdx });
      keyStartIndex = keyEndIndex + width;
    }
    return keyList;
  }

  /**
   * STEP 7.
   * decode record header,
   * includes:
   * [0:8/4]    - record block number
   * [8:16/4:8] - num entries the key-value entries number
   * [16:24/8:12] - record block info size
   * [24:32/12:16] - record block size
   */
  _readRecordHeader(): void {
    this._recordHeaderStartOffset = this._keyBlockInfoEndOffset + this.keyHeader.keyBlocksTotalSize;

    const recordHeaderLen = this.meta.version >= 2.0 ? 4 * 8 : 4 * 4;
    this._recordHeaderEndOffset = this._recordHeaderStartOffset + recordHeaderLen;

    const recordHeaderBuffer = this.scanner.readBuffer(this._recordHeaderStartOffset, recordHeaderLen);

    let ofset = 0;
    const recordBlocksNum = this._readNumber(recordHeaderBuffer.slice(ofset, ofset + this.meta.numWidth)) as number;

    ofset += this.meta.numWidth;
    const entriesNum = this._readNumber(recordHeaderBuffer.slice(ofset, ofset + this.meta.numWidth)) as number;
    assert(entriesNum === this.keyHeader.entriesNum);

    ofset += this.meta.numWidth;
    const recordBlockInfoCompSize = this._readNumber(recordHeaderBuffer.slice(ofset, ofset + this.meta.numWidth)) as number;

    ofset += this.meta.numWidth;
    const recordBlockCompSize = this._readNumber(recordHeaderBuffer.slice(ofset, ofset + this.meta.numWidth)) as number;

    this.recordHeader = {
      recordBlocksNum,
      entriesNum,
      recordBlockInfoCompSize,
      recordBlockCompSize,
    };
  }

  /**
   * STEP 8.
   * decode record Info,
   * [{
   * compSize,
   * compAccu,
   * decompSize,
   * decomAccu
   * }]
   */
  _readRecordInfo(): void {
    this._recordBlockInfoStartOffset = this._recordHeaderEndOffset;

    const recordInfoBuff = this.scanner.readBuffer(this._recordBlockInfoStartOffset, this.recordHeader.recordBlockInfoCompSize);
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
    const recordBlockInfoList: RecordBlockInfo[] = [];
    let offset = 0;
    let compressedAdder = 0;
    let decompressionAdder = 0;
    for (let i = 0; i < this.recordHeader.recordBlocksNum; i++) {
      const compSize = this._readNumber(recordInfoBuff.slice(offset, offset + this.meta.numWidth)) as number;
      offset += this.meta.numWidth;
      const decompSize = this._readNumber(recordInfoBuff.slice(offset, offset + this.meta.numWidth)) as number;
      offset += this.meta.numWidth;

      recordBlockInfoList.push({
        compSize,
        compAccumulator: compressedAdder,
        decompSize,
        decompAccumulator: decompressionAdder,
      });
      compressedAdder += compSize;
      decompressionAdder += decompSize;
    }

    assert(offset === this.recordHeader.recordBlockInfoCompSize);

    assert(compressedAdder === this.recordHeader.recordBlockCompSize);

    this.recordBlockInfoList = recordBlockInfoList;

    this._recordBlockInfoEndOffset = this._recordBlockInfoStartOffset + this.recordHeader.recordBlockInfoCompSize;
    // avoid user not invoke the _decodeRecordBlock method
    this._recordBlockStartOffset = this._recordBlockInfoEndOffset;
  }

  /**
   * STEP 9.
   * decode all records block,
   * this is a slowly method, do not use!
   */
  _readRecordBlock(): void {
    this._recordBlockStartOffset = this._recordBlockInfoEndOffset;
    const keyData: any[] = [];

    /**
     * start reading the record block
     */
    // actual record block
    let sizeCounter = 0;
    let item_counter = 0;
    let recordOffset = this._recordBlockStartOffset;

    for (let idx = 0; idx < this.recordBlockInfoList.length; idx++) {
      let comp_type = 'none';
      const compSize = this.recordBlockInfoList[idx].compSize;
      const decompSize = this.recordBlockInfoList[idx].decompSize;
      const rbCompBuff = this.scanner.readBuffer(recordOffset, compSize);
      recordOffset += compSize;

      // 4 bytes: compression type
      const rbCompType = Buffer.from(rbCompBuff.slice(0, 4));

      // record_block stores the final record data
      let recordBlock: Uint8Array = new Uint8Array(rbCompBuff.length);

      // TODO: igore adler32 offset
      // Note: here ignore the checksum part
      // bytes: adler32 checksum of decompressed record block
      // adler32 = unpack('>I', record_block_compressed[4:8])[0]
      if (rbCompType.toString('hex') === '00000000') {
        recordBlock = rbCompBuff.slice(8, rbCompBuff.length);
      } else {
        // --------------
        // decrypt
        // --------------
        let blockBufDecrypted: Uint8Array | null = null;
        // if encrypt type == 1, the record block was encrypted
        if (this.meta.encrypt === 1 /* || (this.meta.ext == "mdd" && this.meta.encrypt === 2 ) */) {
          // const passkey = new Uint8Array(8);
          // record_block_compressed.copy(passkey, 0, 4, 8);
          // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
          blockBufDecrypted = common.mdxDecrypt(rbCompBuff);
        } else {
          blockBufDecrypted = rbCompBuff.slice(8, rbCompBuff.length);
        }
        // --------------
        // decompress
        // --------------
        if (rbCompType.toString('hex') === '01000000') {
          comp_type = 'lzo';
          // the header was need by lzo library, should append before real compressed data
          const header = Buffer.from([0xf0, decompSize]);
          // Note: if use lzo, here will LZO_E_OUTPUT_RUNOVER, so ,use mini lzo js
          recordBlock = Buffer.from(
            lzo1x.decompress(common.appendBuffer(header, blockBufDecrypted), decompSize, 1308672)
          );
          recordBlock = Buffer.from(recordBlock).slice(
            recordBlock.byteOffset,
            recordBlock.byteOffset + recordBlock.byteLength
          );
        } else if (rbCompType.toString('hex') === '02000000') {
          comp_type = 'zlib';
          // zlib decompress
          recordBlock = Buffer.from(pako.inflate(blockBufDecrypted));
        }
      }
      recordBlock = Buffer.from(recordBlock);

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
        let recordEnd: number;
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
          encoding: this.meta.encoding,
          // record_start,
          // record_end,
          record_idx: idx,
          record_comp_start: recordOffset,
          record_compressed_size: compSize,
          record_decompressed_size: decompSize,
          record_comp_type: comp_type,
          record_encrypted: this.meta.encrypt === 1,
          relateive_record_start: recordStart - offset,
          relative_record_end: recordEnd - offset,
        });

        item_counter++;
      }
      offset += recordBlock.length;
      sizeCounter += compSize;
    }

    assert(sizeCounter === this.recordHeader.recordBlockCompSize);

    this.recordBlockDataList = keyData;
    this._recordBlockEndOffset = this._recordBlockStartOffset + sizeCounter;
  }

  /**
   * find record which record start locate
   * @param {number} recordStart record start offset
   */
  _reduceRecordBlockInfo(recordStart: number): number {
    let left = 0;
    let right = this.recordBlockInfoList.length - 1;
    let mid = 0;
    while (left <= right) {
      mid = left + ((right - left) >> 1);
      if (recordStart >= this.recordBlockInfoList[mid].decompAccumulator) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return left - 1;
  }

  /**
   * decode record block by record block id quickly search
   * @param {number} rbid record block id
   * @param {string} keyText phrase word
   * @param {number} start this word record start offset
   * @param {number} nextStart next word record start offset
   */
  _decodeRecordBlockDataByRecordBlockInfoId(
    rbid: number,
    keyText: string,
    start: number,
    nextStart: number
  ): { keyText: string; definition: string } {
    // decode record block by record block id
    this._recordBlockStartOffset = this._recordBlockInfoEndOffset;
    const compSize = this.recordBlockInfoList[rbid].compSize;
    const decompSize = this.recordBlockInfoList[rbid].decompSize;
    const compAccumulator = this.recordBlockInfoList[rbid].compAccumulator;
    const decompAccumulator = this.recordBlockInfoList[rbid].decompAccumulator;
    const startOffset = compAccumulator + this._recordBlockStartOffset;
    const rbCompBuff = this.scanner.readBuffer(startOffset, compSize);

    // 4 bytes: compression type
    const rbCompType = Buffer.from(rbCompBuff.subarray(0, 4));

    // record_block stores the final record data
    let recordBlock: Uint8Array = new Uint8Array(rbCompBuff.length);

    // TODO: igore adler32 offset
    // Note: here ignore the checksum part
    // bytes: adler32 checksum of decompressed record block
    // adler32 = unpack('>I', record_block_compressed[4:8])[0]
    if (rbCompType.toString('hex') === '00000000') {
      recordBlock = rbCompBuff.subarray(8, rbCompBuff.length);
    } else {
      // --------------
      // decrypt
      // --------------
      let blockBufDecrypted: Uint8Array | null = null;
      // if encrypt type == 1, the record block was encrypted
      if (this.meta.encrypt === 1 /* || (this.meta.ext == "mdd" && this.meta.encrypt === 2 ) */) {
        // const passkey = new Uint8Array(8);
        // record_block_compressed.copy(passkey, 0, 4, 8);
        // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
        blockBufDecrypted = common.mdxDecrypt(rbCompBuff);
      } else {
        blockBufDecrypted = rbCompBuff.subarray(8, rbCompBuff.length);
      }
      // --------------
      // decompress
      // --------------
      if (rbCompType.toString('hex') === '01000000') {
        // the header was need by lzo library, should append before real compressed data

        // const header = Buffer.from([0xf0, decompSize]);
        // // Note: if use lzo, here will LZO_E_OUTPUT_RUNOVER, so ,use mini lzo js
        // recordBlock = Buffer.from(
        //   lzo1x.decompress(
        //     common.appendBuffer(header, blockBufDecrypted),
        //     decompSize,
        //     1308672
        //   )
        // );

        recordBlock = lzo1x.decompress(blockBufDecrypted, decompSize, 1308672);

        recordBlock = Buffer.from(recordBlock).subarray(
          recordBlock.byteOffset,
          recordBlock.byteOffset + recordBlock.byteLength
        );
      } else if (rbCompType.toString('hex') === '02000000') {
        // zlib decompress
        recordBlock = Buffer.from(pako.inflate(blockBufDecrypted));
      }
    }
    recordBlock = Buffer.from(recordBlock);

    // notice that adler32 return signed value
    // TODO: ignore the checksum
    // assert(adler32 == zlib.adler32(record_block) & 0xffffffff)
    assert(recordBlock.length === decompSize);

    const recordStart = start - decompAccumulator;
    const recordEnd = nextStart - decompAccumulator;
    const data = recordBlock.slice(recordStart, recordEnd);
    if (this.meta.ext === 'mdd') {
      return { keyText, definition: BASE64ENCODER(data) };
    }
    return { keyText, definition: this.meta.decoder.decode(data) };
  }

  // _readBuffer(start: number, length: number): Buffer {
  //   return Buffer.from(readChunkSync(this.meta.fname, start, length));
  // }

  _stripKeyOrIngoreCase(key: string): string {
    // this strip/case sensistive part will increase time cost about 100% (20ms->38ms)
    if (this._isStripKey()) {
      key = key.replace(common.REGEXP_STRIPKEY[this.meta.ext], '$1');
    }
    if (!this._isKeyCaseSensitive()) {
      key = key.toLowerCase();
    }
    if (this.meta.ext == 'mdd') {
      key = key.replace(/\\/g, '/');
    }
    return key.trim();
  }

  _isKeyCaseSensitive(): boolean {
    return this.options.isCaseSensitive || common.isTrue(this.header['isCaseSensitive'] as string);
  }

  _isStripKey(): boolean {
    return this.options.isStripKey || common.isTrue(this.header['StripKey'] as string);
  }

  _lookupKeyBlockId(word: string) {
    const lookupInternal = (compareFn: (a: string, b: string) => number) => {
      const sfunc = this._stripKeyOrIngoreCase.bind(this);
      const kbid = this._reduceWordKeyBlock(word, sfunc, compareFn);
      // not found
      if (kbid < 0) {
        return undefined;
      }
      const list = this._decodeKeyBlockByKBID(kbid);
      const i = this._binarySearh(list, word, sfunc, compareFn);
      if (i === undefined) {
        return undefined;
      }
      return { idx: i, list };
    };

    let record;
    if (this._isKeyCaseSensitive()) {
      record = lookupInternal(common.normalUpperCaseWordCompare);
    } else {
      record = lookupInternal(common.normalUpperCaseWordCompare);
      if (record === undefined) {
        record = lookupInternal(common.wordCompare);
      }
    }
    return record;
  }

  _binarySearh(
    list: KeyListItem[],
    word: string,
    _s: (s: string) => string,
    compareFn: (a: string, b: string) => number
  ) {
    let left = 0;
    let right = list.length - 1;
    let mid = 0;
    while (left <= right) {
      mid = left + ((right - left) >> 1);
      // if case sensitive, the uppercase word is smaller than lowercase word
      // for example: `Holanda` is smaller than `abacaxi`
      // so when comparing with the words, we should use the dictionary order,
      // however, if we change the word to lowercase, the binary search algorithm will be confused
      // so, we use the enhanced compare function `common.wordCompare`
      const compareResult = compareFn(_s(word), _s(list[mid].keyText));
      // console.log(`@#@# wordCompare ${_s(word)} ${_s(list[mid].keyText)} ${compareResult} l: ${left} r: ${right} mid: ${mid} ${list[mid].keyText}`)
      if (compareResult > 0) {
        left = mid + 1;
      } else if (compareResult == 0) {
        return mid;
      } else {
        right = mid - 1;
      }
    }
    return mid;
  }

  _search_key_record(word: string): KeyRecord | undefined {
    word = this._stripKeyOrIngoreCase(word);
    // use js internal find
    const keyBlockInfo = this.keyBlockInfoList.find((item, index) => {
      if (item.firstKey <= word && item.lastKey >= word) {
        return true;
      }
    });
    if (!keyBlockInfo) {
      return undefined;
    }
    let propRecordBlockInfo: RecordBlockInfo | undefined = undefined;
    let propIdx = 0;
    for (let i = 0; i < this.recordBlockInfoList.length; i++) {
      const item = this.recordBlockInfoList[i];
      if (item.decompAccumulator >= keyBlockInfo.keyBlockDecompAccumulator) {
        propRecordBlockInfo = item;
        propIdx = i;
        break;
      }
    }

    if (propRecordBlockInfo == undefined) {
      return undefined;
    }

    let locatedRecordBlockInfo = propRecordBlockInfo;
    let locatedIdx = propIdx;
    // 处理正常情况
    if (propIdx > 0 && propIdx < this.recordBlockDataList.length - 1) {
      locatedRecordBlockInfo = this.recordBlockDataList[propIdx - 1];
      locatedIdx = propIdx - 1;
    } else if (propIdx == 0) {
      const firstBlockInfo = this.recordBlockDataList[0];

      const lastBlockInfo = this.recordBlockDataList[this.recordBlockDataList.length - 1];

      // 处理第一个block
      if (firstBlockInfo.firstKey <= word && lastBlockInfo.lastKey >= word) {
        locatedRecordBlockInfo = firstBlockInfo;
        locatedIdx = 0;
      }
      // 处理最后一个block
      if (lastBlockInfo.firstKey <= word && lastBlockInfo.lastKey >= word) {
        locatedRecordBlockInfo = lastBlockInfo;
        locatedIdx = this.recordBlockDataList.length - 1;
      }
    } else {
      // 其他情况不可能出现
    }

    const result: KeyListItem = {
      keyText: word,
      recordStartOffset: locatedRecordBlockInfo.decompAccumulator,
      nextRecordStartOffset: locatedRecordBlockInfo.decompAccumulator + locatedRecordBlockInfo.decompSize,
      original_idx: locatedIdx,

      keyBlockIdx: locatedIdx,
    };
    return result;
  }

  _locate_prefix(word: string): number {
    const end = this.keyList.length;
    word = this._stripKeyOrIngoreCase(word);
    for (let i = 0; i < end; i++) {
      const keyText = this._stripKeyOrIngoreCase(this.keyList[i].keyText);
      if (keyText.startsWith(word)) {
        return i;
      }
    }
    return -1;
  }

  _locate_prefix_list(phrase: string, max_len = 100, max_missed = 100): KeyRecord[] {
    const record = this._locate_prefix(phrase);
    if (record == -1) {
      return [];
    }
    const fn = this._stripKeyOrIngoreCase;

    const list: KeyRecord[] = [];
    let count = 0;
    let missed = 0;
    for (let i = record; i < this.keyList.length; i++) {
      if (this.keyList[i].keyText.startsWith(fn(phrase))) {
        list.push(this.keyList[i]);
        count++;
      } else {
        missed++;
      }
      if (count > max_len) {
        break;
      }
      if (missed > max_missed) {
        break;
      }
    }

    return list;
  }

  /**
   * 经过一系列测试, 发现mdx格式的文件存在较大的词语排序问题，存在如下情况：
   * 1. 大小写的问题 比如 a-zA-Z 和 aA-zZ 这种并存的情况
   * 2. 多语言的情况，存在英文和汉字比较大小的情况一般情况下 英文应当排在汉字前面
   * 3. 小语种的情况
   * 上述的这些情况都有可能出现，无法通过字典头中的设置实现排序，所以无法通过内部的keyInfoList进行快速索引，
   * 在现代计算机的性能条件下，直接遍历全部词条也可得到较好的效果，因此目前采用的策略是全部读取词条，内部排序
   *
   */
  _readNumber(data: Uint8Array, isLittleEndian: boolean = false, numfmt: NumFmt | null = null): number {
    const dataView = new DataView(data.buffer);

    if (numfmt == null) {
      numfmt = this.meta.numFmt;
    }

    if (numfmt == common.NUMFMT_UINT16) {
      return dataView.getUint16(0, isLittleEndian);
    } else if (numfmt == common.NUMFMT_UINT32) {
      return dataView.getUint32(0, isLittleEndian);
    } else if (numfmt == common.NUMFMT_UINT64) {
      return common.readNumber(Buffer.from(data), common.NUMFMT_UINT64 as NumFmt);
    } else {
      return dataView.getUint8(0);
    }
  }
}

export default MDictBase;
