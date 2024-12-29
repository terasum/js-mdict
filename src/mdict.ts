import MdictBase, { KeyRecord, KeyListItem, MDictOptions } from './mdict-base.js';
import common from './utils.js';

interface MdictOptions extends MDictOptions { }

export interface FuzzyWord extends KeyRecord {
  key: string;
  idx: number;
  ed: number;
}

export class Mdict extends MdictBase {

  constructor(fname: string, options?: Partial<MdictOptions>) {
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
   * lookup the word
   * @test ok
   * @param word search word
   * @returns word definition
   */
  lookup(word: string): { keyText: string; definition: string | null } {
    const record = this._lookupKeyBlockId(word);

    // if not found the key block, return undefined
    if (record === undefined) {
      return {
        keyText: word,
        definition: null,
      };
    }

    const i = record.idx;
    const list = record.list;

    const recordBlockInfoId = this._reduceRecordBlockInfo(list[i].recordStartOffset);

    const nextStart =
      i + 1 >= list.length
        ? this._recordBlockStartOffset +
        this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator +
        this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize
        : list[i + 1].recordStartOffset;

    const data = this._decodeRecordBlockDataByRecordBlockInfoId(
      recordBlockInfoId,
      list[i].keyText,
      list[i].recordStartOffset,
      nextStart
    );

    if (this.header['StyleSheet'] && data.definition) {
      return {
        ...data,
        definition: common.substituteStylesheet(
          this.header['StyleSheet'] as { [key: string]: string[] },
          data.definition
        ),
      };
    }
    return data;
  }

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

    const recordBlockInfoId = this._reduceRecordBlockInfo(list[i].recordStartOffset);

    const nextStart =
      i + 1 >= list.length
        ? this._recordBlockStartOffset +
        this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompAccumulator +
        this.recordBlockInfoList[this.recordBlockInfoList.length - 1].decompSize
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

  /**
   * fetch definition by key record
   * @param keyRecord fetch word record
   * @returns the keyText and definition
   */
  fetch_defination(keyRecord: KeyRecord): {
    keyText: string;
    definition: string | null;
  } {
    const rid = this._reduceRecordBlockInfo(keyRecord.recordStartOffset);
    const data = this._decodeRecordBlockDataByRecordBlockInfoId(
      rid,
      keyRecord.keyText,
      keyRecord.recordStartOffset,
      keyRecord.nextRecordStartOffset ?? 0
    );
    return data;
  }

  /**
   * parse defination from record block
   * @test no
   * @param _word word list
   * @param _rstartofset record start offset
   * @returns the defination
   */
  parse_defination(_word: string, _rstartofset?: number): any {
    throw new Error('parse_defination method has been deprecated');
  }

  /**
   * search the prefix like the phrase in the dictionary
   * @test ok
   * @param phrase prefix search phrase
   * @returns the prefix related list
   */
  prefix(phrase: string): {
    key: string;
    recordOffset: number;
    keyText: string;
    recordStartOffset: number;
    rofset?: number;
    nextRecordStartOffset?: number;
    original_idx?: number;
  }[] {
    const record = this._lookupKeyBlockId(phrase);
    const list = record?.list;
    if (!list) {
      return [];
    }
    return list.map((item) => {
      return {
        ...item,
        key: item.keyText,
        recordOffset: item.recordStartOffset,
      };
    });
  }

  /**
   * search matched list of associate words
   * @test ok
   * @param phrase associate search likely workds
   * @returns matched list
   */
  associate(phrase: string): KeyListItem[] | undefined {
    const record = this._lookupKeyBlockId(phrase);
    const matched = record?.list;
    return matched;
  }

  /**
   * fuzzy search words list
   * @test ok
   * @param word search word
   * @param fuzzy_size the fuzzy workd size
   * @param ed_gap edit distance
   * @returns fuzzy word list
   */
  fuzzy_search(word: string, fuzzy_size: number, ed_gap: number): FuzzyWord[] {
    const fuzzy_words: FuzzyWord[] = [];
    let count = 0;

    const record = this._lookupKeyBlockId(word);
    const keyList = record?.list;
    if (!keyList) {
      return [];
    }

    const fn = this._stripKeyOrIngoreCase.bind(this);
    for (let i = 0; i < keyList.length; i++) {
      const item = keyList[i];
      const key = fn(item.keyText);
      const ed = common.levenshteinDistance(key, fn(word));
      if (ed <= ed_gap) {
        count++;
        if (count > fuzzy_size) {
          break;
        }
        fuzzy_words.push({
          ...item,
          key: item.keyText,
          idx: item.recordStartOffset,
          ed: ed,
        });
      }
    }

    return fuzzy_words;
  }

  /**
   * search words by suggestion
   * @test no
   * @param _phrase suggest some words by phrase
   */
  suggest(_phrase: string): never {
    throw new Error('suggest method has been deprecated');
  }
}

export default Mdict;
