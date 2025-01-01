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

export interface KeyHeader {
  keyBlocksNum: number;
  entriesNum: number;
  keyBlockInfoUnpackSize: number;
  keyBlockInfoCompSize: number;
  keyBlocksTotalSize: number;
}

export interface KeyInfoItem {
  firstKey: string;
  lastKey: string;
  keyBlockPackSize: number;
  keyBlockPackAccumulator: number;
  keyBlockUnpackSize: number;
  keyBlockUnpackAccumulator: number;
  keyBlockEntriesNum: number;
  keyBlockEntriesNumAccumulator: number;
  keyBlockInfoIndex: number;
}

export interface KeyWordItem {
  recordStartOffset: number;
  recordEndOffset: number;
  keyText: string;
  keyBlockIdx: number;
}

export interface RecordHeader {
  recordBlocksNum: number;
  entriesNum: number;
  recordBlockInfoCompSize: number;
  recordBlockCompSize: number;
}

export interface RecordInfo {
  packSize: number;
  packAccumulateOffset: number;
  unpackSize: number;
  unpackAccumulatorOffset: number;
}


export class MdictMeta {
  fname: string = '';
  // mdx 密码
  passcode?: string = '';
  // ext 文件后缀
  ext: string = 'mdx';
  // mdx version
  version: number = 2.0;
  // num width
  numWidth: number = 4;
  // num format
  numFmt: NumFmt = common.NUMFMT_UINT32 as NumFmt;
  // encoding 编码
  encoding: string = '';
  // decoder 解码器
  decoder: TextDecoder = new TextDecoder();
  // 是否加密
  encrypt: number = 0;

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
 * 6. read record block info
 * 7. read record block data
 *
 * 词典结构包括如下部分:
 *
 * Header     : 记录词典的meta信息，包括名称、描述、样式、编码方式等
 * KeyInfo    : 记录词典的Key排列信息，设计用于索引
 * KeyBlock   : 记录词典的所有key列表信息，可以在 key block 中得到本词典的所有词条
 * RecordHeader : 记录词典中所有record的meta信息，包括record的数量、大小等
 * RecordInfo : 记录词典的所有record词条释义信息，可以加速检索
 * RecordBlock: 记录词典的所有record词条释义，如果是mdd文件，则为二进制图片、音频等
 *
 */
class MDictBase {
  // 文件扫描
  scanner: FileScanner;

  // mdx meta
  meta: MdictMeta = new MdictMeta();

  // options 读取选项
  options: MDictOptions;

  // -------------------------
  // PART1: header
  // -------------------------

  // header start offset
  _headerStartOffset: number;
  // header end offset
  _headerEndOffset: number;
  // header 数据
  header: MDictHeader;

  // ------------------------
  // PART2: keyHeader
  // ------------------------

  // keyHeader start offset
  _keyHeaderStartOffset: number;
  // keyHeader end offset
  _keyHeaderEndOffset: number;
  // keyHeader 数据
  keyHeader: KeyHeader;

  // ------------------------
  // PART2: keyBlockInfo
  // ------------------------
  // keyBlockInfo start offset
  _keyBlockInfoStartOffset: number;
  // keyBlockInfo end offset
  _keyBlockInfoEndOffset: number;
  // keyBlockInfo 数据 (Key Block Info list)
  keyInfoList: KeyInfoItem[];

  // ------------------------
  // PART2: keyBlock
  // ------------------------

  // keyBlock start offset
  _keyBlockStartOffset: number;
  // keyBlock end offset
  _keyBlockEndOffset: number;
  // keyList 数据(词条列表)
  keywordList: KeyWordItem[];


  // ------------------------
  // PART2: recordHeader
  // ------------------------

  // recordHeader start offset
  _recordHeaderStartOffset: number;
  // recordHeader end offset
  _recordHeaderEndOffset: number;
  // recordHeader 数据
  recordHeader: RecordHeader;

  // ------------------------
  // PART2: recordBlockInfo
  // ------------------------
  // recordInfo start offset
  _recordInfoStartOffset: number;
  // recordInfo end offset
  _recordInfoEndOffset: number;
  // recordBlockInfo 数据
  recordInfoList: RecordInfo[];

  // ------------------------
  // PART2: recordBlock
  // ------------------------
  // recordBlock start offset
  _recordBlockStartOffset: number;
  // recordBlock end offset
  _recordBlockEndOffset: number;
  // keyData 数据
  recordBlockDataList: any[];

  /**
   * mdict constructor
   * @param {string} fname
   * @param {string} passcode
   * @param options
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
      keyBlockInfoUnpackSize: 0,
      keyBlockInfoCompSize: 0,
      keyBlocksTotalSize: 0,
    };

    // -------------------------
    // dict key info section
    // --------------------------
    this._keyBlockInfoStartOffset = 0;
    this._keyBlockInfoEndOffset = 0;
    // key block info list
    this.keyInfoList = [];

    // -------------------------
    // dict key block section
    // --------------------------
    this._keyBlockStartOffset = 0;
    this._keyBlockEndOffset = 0;
    this.keywordList = [];

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
    this._recordInfoStartOffset = 0;
    this._recordInfoEndOffset = 0;
    this.recordInfoList = [];

    // -------------------------
    // dict record block section
    // --------------------------
    this._recordBlockStartOffset = 0;
    this._recordBlockEndOffset = 0;
    this.recordBlockDataList = [];

    this.readDict();
  }

  protected readDict() {
    // STEP1: read header
    this._readHeader();

    // STEP2: read key header
    this._readKeyHeader();

    // STEP3: read key block info
    this._readKeyInfos();

    // STEP4: read key block
    // @depreciated
    // _readKeyBlock method is very slow, avoid invoke dirctly
    // this method will return the whole words list of the dictionaries file, this is very slow
    // NOTE: 本方法非常缓慢，也有可能导致内存溢出，请不要直接调用
    this._readKeyBlocks();

    // STEP5: read record header
    this._readRecordHeader();

    // STEP6: read record block info
    this._readRecordInfos();

    // STEP7: read record block
    // _readRecordBlock method is very slow, avoid invoke directly
    // this._readRecordBlock();

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
  private _readHeader() {
    // [0:4], 4 bytes header length (header_byte_size), big-endian, 4 bytes, 16 bits
    const headerByteSizeDv = this.scanner.readNumber(0, 4);
    const headerByteSize = headerByteSizeDv.getUint32(0);
    // [4:header_byte_size + 4] header_bytes
    const headerBuffer = this.scanner.readBuffer(4, headerByteSize);


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
  private _readKeyHeader() {
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
      this.keyHeader.keyBlockInfoUnpackSize = keyBlockInfoDecompSize;
    }

    // [24:32] - number of key block info compress size
    const keyBlockInfoSizeBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
    const keyBlockInfoSize = this._readNumber(keyBlockInfoSizeBuff) as number;
    offset += this.meta.numWidth;
    this.keyHeader.keyBlockInfoCompSize = keyBlockInfoSize;

    // [32:40] - number of key blocks total size, note, key blocks total size, not key block info
    const keyBlocksTotalSizeBuff = keyHeaderBuff.slice(offset, offset + this.meta.numWidth);
    const keyBlocksTotalSize = this._readNumber(keyBlocksTotalSizeBuff) as number;
    offset += this.meta.numWidth;
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
  private _readKeyInfos() {
    this._keyBlockInfoStartOffset = this._keyHeaderEndOffset;
    const keyBlockInfoBuff = this.scanner.readBuffer(this._keyBlockInfoStartOffset, this.keyHeader.keyBlockInfoCompSize);

    const keyBlockInfoList = this._decodeKeyInfo(keyBlockInfoBuff);

    this._keyBlockInfoEndOffset = this._keyBlockInfoStartOffset + this.keyHeader.keyBlockInfoCompSize;
    assert(
      this.keyHeader.keyBlocksNum === keyBlockInfoList.length,
      'the num_key_info_list should equals to key_block_info_list'
    );

    this.keyInfoList = keyBlockInfoList;

    // NOTE: must set at here, otherwise, if we haven't invoked the _decodeKeyBlockInfo method,
    // var `_recordBlockStartOffset` will not be set.
    this._recordBlockStartOffset = this._keyBlockInfoEndOffset + this.keyHeader.keyBlocksTotalSize;
  }

  /**
   * STEP 3.1. decode key block info, this function will invokde in `_readKeyBlockInfo`
   * and decode the first key and last key infomation, etc.
   * @param {Uint8Array} keyBlockInfoBuff key block info buffer
   */
  private _decodeKeyInfo(keyBlockInfoBuff: Uint8Array): KeyInfoItem[] {
    const keyBlockNum = this.keyHeader.keyBlocksNum;
    const numEntries = this.keyHeader.entriesNum;
    let kbInfoBuff: Uint8Array;
    if (this.meta.version >= 2.0) {
      const compressType = keyBlockInfoBuff.subarray(0, 4).join('');
      // zlib compression
      assert(
        compressType === '2000',
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
        this.keyHeader.keyBlockInfoUnpackSize == kbInfoBuff.length,
        `key_block_info decompress size ${this.keyHeader.keyBlockInfoUnpackSize} should equal to keyblock info buffer length ${kbInfoBuff.length}`
      );
    } else {
      kbInfoBuff = keyBlockInfoBuff;
    }

    const keyBlockInfoList: KeyInfoItem[] = [];

    // init tmp variables
    let countEntriesNum = 0;

    let kbCount = 0;
    let indexOffset = 0;

    let kbPackSizeAccu = 0;
    let kbUnpackSizeAccu = 0;
    while (kbCount < keyBlockNum) {
      let blockWordCount = 0;
      let firstWordBuffer: Uint8Array;
      let lastWordBuffer: Uint8Array;
      let packSize = 0;
      let unpackSize = 0;
      let firstWordSize = 0;
      let lastWordSize = 0;
      let firstKey = '';
      let lastKey = '';

      if (this.meta.version >= 2.0) {


        blockWordCount = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 8), false, common.NUMFMT_UINT64 as NumFmt) as number;

        firstWordSize = this._readNumber(kbInfoBuff.slice(indexOffset + 8, indexOffset + 10), false, common.NUMFMT_UINT16 as NumFmt) as number;
        if (this.meta.encoding === UTF16 || this.meta.ext === 'mdd') {
          firstWordSize = (firstWordSize + 1) * 2;
        }
        firstWordBuffer = kbInfoBuff.slice(indexOffset + 10, indexOffset + 10 + firstWordSize);
        indexOffset += 10 + firstWordSize;

        lastWordSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 2), false, common.NUMFMT_UINT16 as NumFmt) as number;
        lastWordSize = (lastWordSize + 1) * 2;
        lastWordBuffer = kbInfoBuff.slice(indexOffset + 2, indexOffset + 2 + lastWordSize);
        indexOffset += 2 + lastWordSize;

        packSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 8), false, common.NUMFMT_UINT64 as NumFmt) as number;
        unpackSize = this._readNumber(kbInfoBuff.slice(indexOffset + 8, indexOffset + 16), false, common.NUMFMT_UINT64 as NumFmt) as number;
        indexOffset += 16;
        firstKey = this.meta.decoder.decode(firstWordBuffer.slice(0, firstWordSize-2));
        lastKey = this.meta.decoder.decode(lastWordBuffer.slice(0, lastWordSize-2));
        // console.log(firstKey, lastKey)
      } else if (this.meta.version == 1.2) {

        blockWordCount = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 4), false, common.NUMFMT_UINT32 as NumFmt) as number;

        firstWordSize = this._readNumber(kbInfoBuff.slice(indexOffset + 4, indexOffset + 5), false, common.NUMFMT_UINT8 as NumFmt) as number;
        if (this.meta.encoding === UTF16) {
          firstWordSize = firstWordSize * 2;
        }

        firstWordBuffer = kbInfoBuff.slice(indexOffset + 5, indexOffset + 5 + firstWordSize);
        indexOffset += 5 + firstWordSize;

        lastWordSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 1), false, common.NUMFMT_UINT8 as NumFmt) as number;
        if (this.meta.encoding === UTF16) {
          lastWordSize = lastWordSize * 2;
        }

        lastWordBuffer = kbInfoBuff.slice(indexOffset + 1, indexOffset + 1 + lastWordSize);
        indexOffset += 1 + lastWordSize;

        packSize = this._readNumber(kbInfoBuff.slice(indexOffset, indexOffset + 4), false, common.NUMFMT_UINT32 as NumFmt) as number;
        unpackSize = this._readNumber(kbInfoBuff.slice(indexOffset + 4, indexOffset + 8), false, common.NUMFMT_UINT32 as NumFmt) as number;
        indexOffset += 8;
        firstKey = this.meta.decoder.decode(firstWordBuffer.slice(0, firstWordSize));
        lastKey = this.meta.decoder.decode(lastWordBuffer.slice(0, lastWordSize));
      }

      keyBlockInfoList.push({
        firstKey,
        lastKey,
        keyBlockPackSize: packSize,
        keyBlockPackAccumulator: kbPackSizeAccu,
        keyBlockUnpackSize: unpackSize,
        keyBlockUnpackAccumulator: kbUnpackSizeAccu,
        keyBlockEntriesNum: blockWordCount,
        keyBlockEntriesNumAccumulator: countEntriesNum,
        keyBlockInfoIndex: kbCount,
      });

      kbCount += 1; // key block number
      countEntriesNum += blockWordCount;
      kbPackSizeAccu += packSize;
      kbUnpackSizeAccu += unpackSize;
    }
    assert(
      countEntriesNum === numEntries,
      `the number_entries ${numEntries} should equal the count_num_entries ${countEntriesNum}`
    );
    assert(kbPackSizeAccu === this.keyHeader.keyBlocksTotalSize);
    return keyBlockInfoList;
  }

  /**
   * STEP 4. decode key block
   * decode key block return the total keys list,
   * Note: this method runs very slow, please do not use this unless special target
   */
  private _readKeyBlocks() {
    this._keyBlockStartOffset = this._keyBlockInfoEndOffset;

    let keyBlockList: KeyWordItem[] = [];
    let kbStartOffset = this._keyBlockStartOffset;

    for (let idx = 0; idx < this.keyInfoList.length; idx++) {
      const packSize = this.keyInfoList[idx].keyBlockPackSize;
      const unpackSize = this.keyInfoList[idx].keyBlockUnpackSize;

      const start = kbStartOffset;
      assert(start === this.keyInfoList[idx].keyBlockPackAccumulator + this._keyBlockStartOffset, 'should be equal');

      // const end = kbStartOffset + compSize;
      const kbCompBuff = this.scanner.readBuffer(start, packSize);
      const keyBlock = this.unpackKeyBlock(kbCompBuff, unpackSize);

      const splitKeyBlock = this.splitKeyBlock(Buffer.from(keyBlock), idx);
      keyBlockList = keyBlockList.concat(splitKeyBlock);
      kbStartOffset += packSize;
    }
    assert(
      keyBlockList.length === this.keyHeader.entriesNum,
      `key list length: ${keyBlockList.length} should equal to key entries num: ${this.keyHeader.entriesNum}`
    );
    this._keyBlockEndOffset = this._keyBlockStartOffset + this.keyHeader.keyBlocksTotalSize;

    // keep keyBlockList in memory
    this.keywordList = keyBlockList;

  }


  /**
   * step 4.1. decode key block
   * find the key block by the phrase
   * @param kbPackedBuff
   * @param unpackSize
   */
  protected unpackKeyBlock(kbPackedBuff: Uint8Array, unpackSize: number) {
    //  4 bytes : compression type
    const compType = Buffer.from(kbPackedBuff.subarray(0, 4));

    // TODO 4 bytes adler32 checksum
    // 4 bytes : adler checksum of decompressed key block
    // adler32 = unpack('>I', key_block_compressed[start + 4:start + 8])[0]

    let keyBlock: Uint8Array;
    if (compType.toString('hex') == '00000000') {
      keyBlock = kbPackedBuff.subarray(8);
    } else if (compType.toString('hex') == '01000000') {
      // TODO: test for v2.0 dictionary
      const decompressedBuff = lzo1x.decompress(kbPackedBuff.subarray(8), unpackSize, 0);
      keyBlock = Buffer.from(decompressedBuff);
    } else if (compType.toString('hex') === '02000000') {
      keyBlock = Buffer.from(pako.inflate(kbPackedBuff.subarray(8)));
      // extract one single key block into a key list

      // notice that adler32 returns signed value
      // TODO compare with previous word
      // assert(adler32 == zlib.adler32(key_block) & 0xffffffff)
    } else {
      throw Error(`cannot determine the compress type: ${compType.toString('hex')}`);
    }

    return keyBlock;
  }

  /**
   * STEP 4.2. split keys from key block
   * split key from key block buffer
   * @param {Buffer} keyBlock key block buffer
   * @param {number} keyBlockIdx
   */
  protected splitKeyBlock(keyBlock: Uint8Array, keyBlockIdx: number): KeyWordItem[] {
    const width: number = this.meta.encoding == 'UTF-16' || this.meta.ext == 'mdd' ? 2 : 1;
    const keyList: KeyWordItem[] = [];

    // because 0-7 is the leading number, we start at keyblock[7]
    let keyStartIndex = 0;
    while (keyStartIndex < keyBlock.length) {
      let meaningOffset = 0;

      if (this.meta.version == 2.0) {
        meaningOffset = common.b2n64(keyBlock.subarray(keyStartIndex, keyStartIndex + this.meta.numWidth));
      } else if (this.meta.version == 1.2)  {
        meaningOffset = common.b2n32(keyBlock.subarray(keyStartIndex, keyStartIndex + this.meta.numWidth));
      }

      let keyEndIndex = -1;

      // let i = keyStartIndex + this.meta.numWidth;
      let i = keyStartIndex + this.meta.numWidth;
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

      // const keyTextBuffer = keyBlock.subarray(keyStartIndex + this.meta.numWidth, keyEndIndex);
      const keyTextBuffer = keyBlock.subarray(keyStartIndex + this.meta.numWidth, keyEndIndex);

      const keyText = this.meta.decoder.decode(keyTextBuffer);

      if (keyList.length > 0) {
        keyList[keyList.length - 1].recordEndOffset = meaningOffset;
      }

      keyList.push({ recordStartOffset: meaningOffset, keyText, keyBlockIdx: keyBlockIdx, recordEndOffset: -1 });
      keyStartIndex = keyEndIndex + width;
    }

    return keyList;
  }

  /**
   * STEP 5.
   * decode record header,
   * includes:
   * [0:8/4]    - record block number
   * [8:16/4:8] - num entries the key-value entries number
   * [16:24/8:12] - record block info size
   * [24:32/12:16] - record block size
   */
  private _readRecordHeader(): void {
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
   * STEP 6.
   * decode record Info,
   */
  private _readRecordInfos(): void {
    this._recordInfoStartOffset = this._recordHeaderEndOffset;

    const recordInfoBuff = this.scanner.readBuffer(this._recordInfoStartOffset, this.recordHeader.recordBlockInfoCompSize);
    /**
     * record_block_info_list:
     * [{
     *   packSize: number
     *   packAccumulateOffset: number
     *   unpackSize: number,
     *   unpackAccumulatorOffset: number
     * }]
     * Note: every record block will contain a lot of entries
     */
    const recordBlockInfoList: RecordInfo[] = [];
    let offset = 0;
    let compressedAdder = 0;
    let decompressionAdder = 0;
    for (let i = 0; i < this.recordHeader.recordBlocksNum; i++) {
      const packSize = this._readNumber(recordInfoBuff.slice(offset, offset + this.meta.numWidth)) as number;
      offset += this.meta.numWidth;
      const unpackSize = this._readNumber(recordInfoBuff.slice(offset, offset + this.meta.numWidth)) as number;
      offset += this.meta.numWidth;

      recordBlockInfoList.push({
        packSize: packSize,
        packAccumulateOffset: compressedAdder,
        unpackSize: unpackSize,
        unpackAccumulatorOffset: decompressionAdder,
      });
      compressedAdder += packSize;
      decompressionAdder += unpackSize;
    }

    assert(offset === this.recordHeader.recordBlockInfoCompSize);

    assert(compressedAdder === this.recordHeader.recordBlockCompSize);

    this.recordInfoList = recordBlockInfoList;

    this._recordInfoEndOffset = this._recordInfoStartOffset + this.recordHeader.recordBlockInfoCompSize;
    // avoid user not invoke the _decodeRecordBlock method
    this._recordBlockStartOffset = this._recordInfoEndOffset;
  }

  /**
   * STEP 7.
   * read all records block,
   * this is a slow method, do not use!
   */
  _readRecordBlocks(): void {
    this._recordBlockStartOffset = this._recordInfoEndOffset;
    const keyData: any[] = [];

    /**
     * start reading the record block
     */
    // actual record block
    let sizeCounter = 0;
    let itemCounter = 0;
    let recordOffset = this._recordBlockStartOffset;

    for (let idx = 0; idx < this.recordInfoList.length; idx++) {
      let compressType = 'none';
      const packSize = this.recordInfoList[idx].packSize;
      const unpackSize = this.recordInfoList[idx].unpackSize;
      const rbPackBuff = this.scanner.readBuffer(recordOffset, packSize);
      recordOffset += packSize;

      // 4 bytes: compression type
      const rbCompType = Buffer.from(rbPackBuff.slice(0, 4));

      // record_block stores the final record data
      let recordBlock: Uint8Array = new Uint8Array(rbPackBuff.length);

      // TODO: ignore adler32 offset
      // Note: here ignore the checksum part
      // bytes: adler32 checksum of decompressed record block
      // adler32 = unpack('>I', record_block_compressed[4:8])[0]
      if (rbCompType.toString('hex') === '00000000') {
        recordBlock = rbPackBuff.slice(8, rbPackBuff.length);
      } else {
        // decrypt
        let blockBufDecrypted: Uint8Array | null = null;
        // if encrypt type == 1, the record block was encrypted
        if (this.meta.encrypt === 1 /* || (this.meta.ext == "mdd" && this.meta.encrypt === 2 ) */) {
          // const passkey = new Uint8Array(8);
          // record_block_compressed.copy(passkey, 0, 4, 8);
          // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
          blockBufDecrypted = common.mdxDecrypt(rbPackBuff);
        } else {
          blockBufDecrypted = rbPackBuff.slice(8, rbPackBuff.length);
        }
        // --------------
        // decompress
        // --------------
        if (rbCompType.toString('hex') === '01000000') {
          compressType = 'lzo';
          // the header was needed by lzo library, should append before real compressed data
          // const header = Buffer.from([0xf0, decompSize]);
          // Note: if use lzo, here will LZO_E_OUTPUT_RUNOVER, so ,use mini lzo js
          // recordBlock = Buffer.from(
          // lzo1x.decompress(common.appendBuffer(header, blockBufDecrypted), decompSize, 1308672)
          // );
          recordBlock = Buffer.from(
            lzo1x.decompress(blockBufDecrypted, unpackSize, 0)
          );
          recordBlock = Buffer.from(recordBlock).slice(
            recordBlock.byteOffset,
            recordBlock.byteOffset + recordBlock.byteLength
          );
        } else if (rbCompType.toString('hex') === '02000000') {
          compressType = 'zlib';
          // zlib decompress
          recordBlock = Buffer.from(pako.inflate(blockBufDecrypted));
        }
      }

      // notice that adler32 return signed value
      // TODO: ignore the checksum
      // assert(adler32 == zlib.adler32(record_block) & 0xffffffff)

      assert(recordBlock.length === unpackSize);

      /**
       * 请注意，block 是会有很多个的，而每个block都可能会被压缩
       * 而 key_list中的 record_start, key_text是相对每一个block而言的，end是需要每次解析的时候算出来的
       * 所有的record_start/length/end都是针对解压后的block而言的
       */

      // split record block according to the offset info from key block
      let offset = 0;
      let i = 0;
      while (i < this.keywordList.length) {
        const recordStart = this.keywordList[i].recordStartOffset;
        const keyText = this.keywordList[i].keyText;

        // # reach the end of current record block
        if (recordStart - offset >= recordBlock.length) {
          break;
        }
        // # record end index
        let recordEnd: number;
        if (i < this.keywordList.length - 1) {
          recordEnd = this.keywordList[i + 1].recordStartOffset;
        } else {
          recordEnd = recordBlock.length + offset;
        }
        i += 1;
        // const data = record_block.slice(record_start - offset, record_end - offset);
        keyData.push({
          key: keyText,
          idx: itemCounter,
          // data,
          encoding: this.meta.encoding,
          // record_start,
          // record_end,
          record_idx: idx,
          record_comp_start: recordOffset,
          record_compressed_size: packSize,
          record_decompressed_size: unpackSize,
          record_comp_type: compressType,
          record_encrypted: this.meta.encrypt === 1,
          relative_record_start: recordStart - offset,
          relative_record_end: recordEnd - offset,
        });

        itemCounter++;
      }
      offset += recordBlock.length;
      sizeCounter += packSize;
    }

    assert(sizeCounter === this.recordHeader.recordBlockCompSize);

    this.recordBlockDataList = keyData;
    this._recordBlockEndOffset = this._recordBlockStartOffset + sizeCounter;
  }


  /**
   * read a fixed width number
   * @param data
   * @param isLittleEndian
   * @param numfmt
   * @private
   */
  private _readNumber(data: Uint8Array, isLittleEndian: boolean = false, numfmt: NumFmt | null = null): number {
    const dataView = new DataView(data.buffer);

    if (numfmt == null) {
      numfmt = this.meta.numFmt;
    }

    if (numfmt == common.NUMFMT_UINT16) {
      return dataView.getUint16(0, isLittleEndian);
    } else if (numfmt == common.NUMFMT_UINT32) {
      return dataView.getUint32(0, isLittleEndian);
    } else if (numfmt == common.NUMFMT_UINT64) {
      try{
        return common.readNumber(Buffer.from(data), common.NUMFMT_UINT64 as NumFmt);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch {
        return 2**53;
      }
      // return dataView.getBigUint64(0, isLittleEndian) as bigint;
    } else {
      return dataView.getUint8(0);
    }
  }
}

export default MDictBase;
