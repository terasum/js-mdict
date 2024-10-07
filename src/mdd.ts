import { Mdict } from './mdict.ts';

export class MDD extends Mdict {
  /**
   * locate the resource key
   * @test no
   * @param resourceKey resource key
   * @returns the keyText and definition
   */
  locate(resourceKey: string): { keyText: string; definition: string | null } {
    const record = this._lookupKeyBlockId(resourceKey);

    // if not found the key block, return undefined
    if (record === undefined) {
      return {
        keyText: resourceKey,
        definition: null,
      };
    }

    const i = record.idx;
    const list = record.list;

    const recordBlockInfoId = this._reduceRecordBlockInfo(
      list[i].recordStartOffset
    );

    const nextStart =
      i + 1 >= list.length
        ? this._recordBlockStartOffset +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompAccumulator +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompSize
        : list[i + 1].recordStartOffset;

    // TODO should return UInt8Array
    const data = this._decodeRecordBlockDataByRecordBlockInfoId(
      recordBlockInfoId,
      list[i].keyText,
      list[i].recordStartOffset,
      nextStart
    );

    return data;
  }
}
