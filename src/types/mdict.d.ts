/// <reference types="typescript" />

declare namespace mdict {
  interface KeyHeader {
    keyBlocksNum: number;
    entriesNum: number;
    keyBlockInfoDecompSize: number;
    keyBlockInfoCompSize: number;
    keyBlocksTotalSize: number;
  }

  interface RecordHeader {
    recordBlocksNum: number;
    entriesNum: number;
    recordBlockInfoCompSize: number;
    recordBlockCompSize: number;
  }

  interface KeyBlockInfo {
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

  interface RecordBlockInfo {
    compSize: number;
    compAccumulator: number;
    decompSize: number;
    decompAccumulator: number;
  }

  interface KeyDataItem {
    key: string;
    idx: number;
    encoding: string;
    record_idx: number;
    record_comp_start: number;
    record_compressed_size: number;
    record_decompressed_size: number;
    record_comp_type: string;
    record_encrypted: boolean;
    relateive_record_start: number;
    relative_record_end: number;
  }

  interface KeyListItem {
    recordStartOffset: number;
    keyText: string;
  }

  class MdictBase {
    constructor(path: string);
    fname: string;
    ext: string;
    header: any;
    keyHeader: KeyHeader;
    recordHeader: RecordHeader;
    keyBlockInfoList: Array<KeyBlockInfo>;
    keyList: Array<KeyListItem>;
    recordBlockInfoList: Array<RecordBlockInfo>;

    keyData: Array<KeyDataItem>;
  }
}

declare interface WordDefinition {
  keyText: string;
  definition: string;
}
declare interface WordIndex {
  key: string;
  rofset: number;
  recordStartOffset?: number;
  ed?: number;
}

// public KeyListItem
declare interface KeyListItem {
    recordStartOffset: number;
    keyText: string;
  }
declare class Mdict extends mdict.MdictBase {
  constructor(path: string);
  lookup(word: string): WordDefinition;
  prefix(word: string): Array<WordIndex>;
  suggest(word: string): Promise<Array<string>>;
  fuzzy_search(word: string, fuzzy_size: number, ed_gap: number): Array<WordIndex>;
  associate(word: string): Array<WordIndex>;
  parse_defination(key: string, rofset: number): string;
  rangeKeyWords(keep?:boolean): Array<KeyListItem>
}

export { Mdict, WordDefinition, WordIndex };

declare function Mdict(path: string): any;
export default Mdict;
