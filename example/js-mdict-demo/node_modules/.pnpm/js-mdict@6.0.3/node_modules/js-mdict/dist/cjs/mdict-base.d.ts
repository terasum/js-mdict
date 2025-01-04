import { NumFmt } from './utils.js';
import { FileScanner } from './scanner.js';
export interface MDictOptions {
    passcode?: string;
    debug?: boolean;
    resort?: boolean;
    isStripKey?: boolean;
    isCaseSensitive?: boolean;
    encryptType?: number;
}
export interface MDictHeader {
    [key: string]: string | {
        [key: string]: string[];
    };
}
export interface KeyHeader {
    keywordBlocksNum: number;
    keywordNum: number;
    keyInfoUnpackSize: number;
    keyInfoPackedSize: number;
    keywordBlockPackedSize: number;
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
    recordInfoCompSize: number;
    recordBlockCompSize: number;
}
export interface RecordInfo {
    packSize: number;
    packAccumulateOffset: number;
    unpackSize: number;
    unpackAccumulatorOffset: number;
}
export declare class MdictMeta {
    fname: string;
    passcode?: string;
    ext: string;
    version: number;
    numWidth: number;
    numFmt: NumFmt;
    encoding: string;
    decoder: TextDecoder;
    encrypt: number;
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
declare class MDictBase {
    protected scanner: FileScanner;
    meta: MdictMeta;
    options: MDictOptions;
    protected _headerStartOffset: number;
    protected _headerEndOffset: number;
    header: MDictHeader;
    protected _keyHeaderStartOffset: number;
    protected _keyHeaderEndOffset: number;
    keyHeader: KeyHeader;
    protected _keyBlockInfoStartOffset: number;
    protected _keyBlockInfoEndOffset: number;
    keyInfoList: KeyInfoItem[];
    protected _keyBlockStartOffset: number;
    protected _keyBlockEndOffset: number;
    keywordList: KeyWordItem[];
    protected _recordHeaderStartOffset: number;
    protected _recordHeaderEndOffset: number;
    recordHeader: RecordHeader;
    protected _recordInfoStartOffset: number;
    protected _recordInfoEndOffset: number;
    recordInfoList: RecordInfo[];
    protected _recordBlockStartOffset: number;
    protected _recordBlockEndOffset: number;
    recordBlockDataList: any[];
    /**
     * mdict constructor
     * @param {string} fname
     * @param {string} passcode
     * @param options
     */
    constructor(fname: string, passcode?: string, options?: Partial<MDictOptions>);
    strip(key: string): string;
    comp(word1: string, word2: string): number;
    private _isKeyCaseSensitive;
    private _isStripKey;
    readDict(): void;
    /**
     * STEP 4.2. split keys from key block
     * split key from key block buffer
     * @param {Buffer} keyBlock key block buffer
     * @param {number} keyBlockIdx
     */
    protected splitKeyBlock(keyBlock: Uint8Array, keyBlockIdx: number): KeyWordItem[];
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
    private _readHeader;
    /**
     * STEP 2. read key block header
     * read key block header
     */
    private _readKeyHeader;
    /**
     * STEP 3. read key block info, if you want quick search, read at here already enough
     * read key block info
     * key block info list
     */
    private _readKeyInfos;
    /**
     * STEP 3.1. decode key block info, this function will invokde in `_readKeyBlockInfo`
     * and decode the first key and last key infomation, etc.
     * @param {Uint8Array} keyInfoBuff key block info buffer
     */
    private _decodeKeyInfo;
    /**
     * step 4.1. decode key block
     * find the key block by the phrase
     * @param kbPackedBuff
     * @param unpackSize
     */
    protected unpackKeyBlock(kbPackedBuff: Uint8Array, unpackSize: number): Uint8Array;
    /**
     * STEP 4. decode key block
     * decode key block return the total keys list,
     * Note: this method runs very slow, please do not use this unless special target
     */
    private _readKeyBlocks;
    /**
     * STEP 5.
     * decode record header,
     * includes:
     * [0:8/4]    - record block number
     * [8:16/4:8] - num entries the key-value entries number
     * [16:24/8:12] - record block info size
     * [24:32/12:16] - record block size
     */
    private _readRecordHeader;
    /**
     * STEP 6.
     * decode record Info,
     */
    private _readRecordInfos;
    /**
     * STEP 7.
     * read all records block,
     * this is a slow method, do not use!
     */
    _readRecordBlocks(): void;
}
export default MDictBase;
