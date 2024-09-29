/// <reference path="../typings/mdict.d.ts" />

import { lemmatizer } from 'lemmatizer';
import MdictBase from './mdict-base';
import common from './utils';

interface MdictOptions {
  passcode?: string;
  debug?: boolean;
  resort?: boolean;
  isStripKey?: boolean;
  isCaseSensitive?: boolean;
}

interface KeyRecord {
  keyText: string;
  recordStartOffset: number;
  recordOffset?: number;
  rofset?: number;
  nextRecordStartOffset?: number;
  original_idx?: number;
}

interface FuzzyWord extends KeyRecord {
  key: string;
  idx: number;
  ed: number;
}

export class Mdict extends MdictBase {
  options: MdictOptions;

  constructor(fname: string, options?: MdictOptions) {
    options = options || {};
    options = {
      passcode: options.passcode ?? '',
      debug: options.debug ?? false,
      resort: options.resort ?? true,
      isStripKey: options.isStripKey ?? true,
      isCaseSensitive: options.isCaseSensitive ?? true,
    };

    const passcode = options.passcode || undefined;
    super(fname, passcode, options);
    this.options = options;
  }

  lookup(word: string): any {
    if (this.options.resort) {
      return this._lookup_key_record(word);
    } else {
      throw new Error(
        'depreciated, use `option.resort = true` to find out word'
      );
    }
  }

  locate(resourceKey: string): any {
    return this._lookup_key_record(resourceKey);
  }

  fetch_defination(keyRecord: KeyRecord): any {
    const rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
    const data = this._decodeRecordBlockByRbId(
      rid,
      keyRecord.keyText,
      keyRecord.recordStartOffset,
      keyRecord.nextRecordStartOffset ?? 0
    );
    return data;
  }

  parse_defination(word: string, rstartofset: number): any {
    let keyRecord = this.lookup(word);
    if (!keyRecord) {
      return { word, definition: null };
    }
    return this.fetch_defination(keyRecord);
  }

  prefix(phrase: string): any[] {
    const list = this._locate_prefix_list(phrase);
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

  associate(phrase: string): any[] {
    const matched = this._locate_prefix_list(phrase, 100);

    matched.map((item) => {
      item.recordOffset = item.recordStartOffset;
    });
    return matched;
  }

  fuzzy_search(word: string, fuzzy_size: number, ed_gap: number): FuzzyWord[] {
    const fuzzy_words: FuzzyWord[] = [];
    let count = 0;
    const fn = this._stripKeyOrIngoreCase;
    for (let i = 0; i < this.keyList.length; i++) {
      let item = this.keyList[i];
      let key = fn(item.keyText);
      let ed = common.levenshteinDistance(key, fn(word));
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

  lemmer(phrase: string): string {
    return lemmatizer(phrase);
  }

  suggest(phrase: string): never {
    throw new Error('suggest method has been deprecated');
  }

  _search_key_record(word: string): KeyRecord | undefined {
    const _strip = this._stripKeyOrIngoreCase;
    word = _strip(word);
    for (let i = 0; i < this.keyList.length; i++) {
      let keyText = _strip(this.keyList[i].keyText);
      if (word == keyText) {
        return this.keyList[i];
      }
    }
    return undefined;
  }

  _lookup_key_record(word: string): any {
    const keyRecord = this._search_key_record(word);
    if (keyRecord === undefined) {
      return {
        keyText: word,
        definition: null,
      };
    }

    const i = keyRecord.original_idx || 0;
    const rid = this._reduceRecordBlock(keyRecord.recordStartOffset);
    const nextStart =
      i + 1 >= this.keyList.length
        ? this._recordBlockStartOffset +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompAccumulator +
          this.recordBlockInfoList[this.recordBlockInfoList.length - 1]
            .decompSize
        : this.keyList[this.keyListRemap[i + 1]].recordStartOffset;
    const data = this._decodeRecordBlockByRbId(
      rid,
      keyRecord.keyText,
      keyRecord.recordStartOffset,
      nextStart
    );
    return data;
  }

  _locate_prefix(word: string): number {
    const _strip = this._stripKeyOrIngoreCase;
    let end = this.keyList.length;
    word = _strip(word);
    for (let i = 0; i < end; i++) {
      let keyText = _strip(this.keyList[i].keyText);
      if (keyText.startsWith(word)) {
        return i;
      }
    }
    return -1;
  }

  _locate_prefix_list(
    phrase: string,
    max_len = 100,
    max_missed = 100
  ): KeyRecord[] {
    const record = this._locate_prefix(phrase);
    if (record == -1) {
      return [];
    }
    const fn = this._stripKeyOrIngoreCase;

    let list: KeyRecord[] = [];
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
}

export default Mdict;
