import MdictBase, { KeyWordItem, KeyInfoItem, MDictOptions } from './mdict-base.js';
import common from './utils.js';
import lzo1x from './lzo1x-wrapper';
import zlib from 'zlib';

const pako = {
  inflate: zlib.inflateSync
};

export class Mdict extends MdictBase {

  constructor(fname: string, options?: Partial<MDictOptions>) {
    options = options || {};
    // default options
    options = {
      passcode: options.passcode ?? '',
      debug: options.debug ?? false,
      resort: options.resort ?? true,
      isStripKey: options.isStripKey ?? true,
      isCaseSensitive: options.isCaseSensitive ?? true,
      encryptType: options.encryptType ?? -1,
    };

    const passcode = options.passcode || undefined;
    super(fname, passcode, options);
  }




  /**
   * lookupKeyInfoItem lookup the `keyInfoItem`
   * the `keyInfoItem` contains key-word record block location: recordStartOffset
   * the `recordStartOffset` should indicate the unpacked record data relative offset
   * @param word the target word phrase
   */
  lookupKeyBlockByWord(word: string) : KeyWordItem | undefined {
    const keyBlockInfoId = this.lookupKeyInfoByWord(word);
    if (keyBlockInfoId < 0) {
      return undefined;
    }

    // TODO: if the this.list length parse too slow, can decode by below code
    // const list = this.lookupPartialKeyBlockListByKeyInfoId(keyInfoId);
    const list = this.keywordList;
    // binary search
    let left = 0;
    let right = list.length - 1;
    let mid = 0;

    while (left <= right) {
      mid = left + ((right - left) >> 1);

      const compRes = this.comp(word, list[mid].keyText);
      if (compRes > 0) {
        left = mid + 1;
      } else if (compRes == 0) {
        break;
      } else {
        right = mid - 1;
      }
    }

    if (mid == -1) {
      return undefined;
    }

    return list[mid];
  }

  /**
   * locate the record meaning buffer by `keyListItem`
   * the `KeyBlockItem.recordStartOffset` should indicate the record block info location
   * use the record block info, we can get the `recordBuffer`, then we need decrypt and decompress
   * use decompressed `recordBuffer` we can get the total block which contains meanings
   * then, use:
   *  const start = item.recordStartOffset - recordBlockInfo.unpackAccumulatorOffset;
   *  const end = item.recordEndOffset - recordBlockInfo.unpackAccumulatorOffset;
   *  the finally meaning's buffer is `unpackRecordBlockBuff[start, end]`
   * @param item
   */
  lookupRecordByKeyBlock(item: KeyWordItem) {
    const recordBlockIndex = this.reduceRecordBlockInfo(item.recordStartOffset);
    const recordBlockInfo = this.recordInfoList[recordBlockIndex];
    const recordBuffer = this.scanner.readBuffer(this._recordBlockStartOffset + recordBlockInfo.packAccumulateOffset, recordBlockInfo.packSize);
    const unpackRecordBlockBuff = this.decompressBuff(recordBuffer, recordBlockInfo.unpackSize);

    const start = item.recordStartOffset - recordBlockInfo.unpackAccumulatorOffset;
    const end = item.recordEndOffset - recordBlockInfo.unpackAccumulatorOffset;
    return unpackRecordBlockBuff.subarray(start, end);
  }

  /**
   * lookupPartialKeyInfoListById
   * decode key block by key block id, and we can get the partial key list
   * the key list just contains the partial key list
   * @param {number} keyInfoId key block id
   * @return {KeyWordItem[]}
   */
  lookupPartialKeyBlockListByKeyInfoId(keyInfoId: number): KeyWordItem[] {
    const packSize = this.keyInfoList[keyInfoId].keyBlockPackSize;
    const unpackSize = this.keyInfoList[keyInfoId].keyBlockUnpackSize;
    const startOffset = this.keyInfoList[keyInfoId].keyBlockPackAccumulator + this._keyBlockStartOffset;
    const keyBlockPackedBuff = this.scanner.readBuffer(startOffset, packSize);
    const keyBlock = this.unpackKeyBlock(keyBlockPackedBuff, unpackSize);
    return this.splitKeyBlock(keyBlock, keyInfoId);
  }


  /**
   * lookupInfoBlock reduce word find the nearest key block
   * @param {string} word searching phrase
   * @param keyInfoList
   */
  lookupKeyInfoByWord(word: string, keyInfoList?: KeyInfoItem[]): number {
    const list = keyInfoList ? keyInfoList : this.keyInfoList;

    let left = 0;
    let right = list.length - 1;
    let mid = 0;

    // when compare the word, the uppercase words are less than lowercase words
    // so we compare with the greater symbol is wrong, we need to use the `common.wordCompare` function
    while (left <= right) {
      mid = left + ((right - left) >> 1);
      if (this.comp(word, list[mid].firstKey) >= 0 &&
        this.comp(word, list[mid].lastKey) <= 0) {
        return mid;
      } else if (this.comp(word, list[mid].lastKey) >= 0) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return -1;
  }


  private decompressBuff(recordBuffer: Uint8Array, unpackSize: number) {
    // decompress
    // 4 bytes: compression type
    const rbCompType = Buffer.from(recordBuffer.subarray(0, 4));
    // record_block stores the final record data
    let unpackRecordBlockBuff: Uint8Array = new Uint8Array(recordBuffer.length);

    // TODO: igore adler32 offset
    // Note: here ignore the checksum part
    // bytes: adler32 checksum of decompressed record block
    // adler32 = unpack('>I', record_block_compressed[4:8])[0]
    if (rbCompType.toString('hex') === '00000000') {
      unpackRecordBlockBuff = recordBuffer.slice(8);
    } else {
      // decrypt
      let blockBufDecrypted: Uint8Array | null = null;
      // if encrypt type == 1, the record block was encrypted
      if (this.meta.encrypt === 1 /* || (this.meta.ext == "mdd" && this.meta.encrypt === 2 ) */) {
        // const passkey = new Uint8Array(8);
        // record_block_compressed.copy(passkey, 0, 4, 8);
        // passkey.set([0x95, 0x36, 0x00, 0x00], 4); // key part 2: fixed data
        blockBufDecrypted = common.mdxDecrypt(recordBuffer);
      } else {
        blockBufDecrypted = recordBuffer.subarray(8, recordBuffer.length);
      }

      // decompress
      if (rbCompType.toString('hex') === '01000000') {
        unpackRecordBlockBuff = lzo1x.decompress(blockBufDecrypted, unpackSize, 1308672);
        unpackRecordBlockBuff = Buffer.from(unpackRecordBlockBuff).subarray(
          unpackRecordBlockBuff.byteOffset,
          unpackRecordBlockBuff.byteOffset + unpackRecordBlockBuff.byteLength
        );
      } else if (rbCompType.toString('hex') === '02000000') {
        // zlib decompress
        unpackRecordBlockBuff = Buffer.from(pako.inflate(blockBufDecrypted));
      }
    }
    return unpackRecordBlockBuff;
  }


  /**
   * find record which record start locate
   * @param {number} recordStart record start offset
   */
  private reduceRecordBlockInfo(recordStart: number): number {
    let left = 0;
    let right = this.recordInfoList.length - 1;
    let mid = 0;
    while (left <= right) {
      mid = left + ((right - left) >> 1);
      if (recordStart >= this.recordInfoList[mid].unpackAccumulatorOffset) {
        left = mid + 1;
      } else {
        right = mid - 1;
      }
    }
    return left - 1;
  }


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
export default Mdict;
