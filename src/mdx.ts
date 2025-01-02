import { Mdict } from './mdict.js';
import { KeyWordItem } from '../src/mdict-base.js';


import  common  from './utils.js';

export interface FuzzyWord extends KeyWordItem {
  key: string;
  idx: number;
  ed: number;
}

export class MDX extends Mdict {
  /**
   * lookup the word
   * @test ok
   * @param word search word
   * @returns word definition
   */
  lookup(word: string): { keyText: string; definition: string | null } {
    const keyWordItem = this.lookupKeyBlockByWord(word);
    if (!keyWordItem) {
      return {
        keyText: word,
        definition: null
      };
    }
    const def = this.lookupRecordByKeyBlock(keyWordItem);
    if (!def) {
      return {
        keyText: word,
        definition: null
      };
    }

    return {
      keyText: word,
      definition: this.meta.decoder.decode(def)
    };
  };

  /**
   * search the prefix like the phrase in the dictionary
   * @test ok
   * @param prefix prefix search phrase
   * @returns the prefix related list
   */
  prefix(prefix: string): KeyWordItem[] {
    const keywordList =  this.associate(prefix);
    return keywordList.filter(item => {
      return item.keyText.startsWith(prefix);
    });
  }

  /**
   * search matched list of associate words
   * @test ok
   * @param phrase associate search likely workds
   * @returns matched list
   */
  associate(phrase: string): KeyWordItem[] {
    const keyBlockItem = this.lookupKeyBlockByWord(phrase);
    if (!keyBlockItem) {
      return [];
    }
    return this.keywordList.filter((keyword) => {
      return keyword.keyBlockIdx == keyBlockItem.keyBlockIdx;
    });
  }

  fetch_definition(keywordItem : KeyWordItem): { keyText: string; definition: string | null } {
    const def = this.lookupRecordByKeyBlock(keywordItem);
    if (!def) {
      return {
        keyText: keywordItem.keyText,
        definition: null
      };
    }

    return {
      keyText: keywordItem.keyText,
      definition: this.meta.decoder.decode(def)
    };
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


    const keywordList =  this.associate(word);
    keywordList.forEach(item => {
      const key = this.strip(item.keyText);
      const ed = common.levenshteinDistance(key, this.strip(word));
      if (ed <= ed_gap) {
        count++;
        if (count > fuzzy_size) {
          return;
        }
        fuzzy_words.push({
          ...item,
          key: item.keyText,
          idx: item.recordStartOffset,
          ed: ed,
        });
      }}
    );

    return fuzzy_words;
  }
}
