import { Mdict, FuzzyWord } from './mdict.js';
import { KeyListItem, KeyRecord } from './mdict-base.js';

export class MDX extends Mdict {
  /**
   * lookup the word
   * @test ok
   * @param word search word
   * @returns word definition
   */
  lookup(word: string): { keyText: string; definition: string | null } {
    return super.lookup(word);
  }

  /**
   * locate the resource key
   * @test no
   * @param resourceKey resource key
   * @returns the keyText and definition
   */
  locate(resourceKey: string): { keyText: string; definition: string | null } {
    return super.locate(resourceKey);
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
    return super.fetch_defination(keyRecord);
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
    return super.prefix(phrase);
  }

  /**
   * search matched list of associate words
   * @test ok
   * @param phrase associate search likely workds
   * @returns matched list
   */
  associate(phrase: string): KeyListItem[] | undefined {
    return super.associate(phrase);
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
    return super.fuzzy_search(word, fuzzy_size, ed_gap);
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
