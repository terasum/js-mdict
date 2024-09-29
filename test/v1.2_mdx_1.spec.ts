import { expect } from '@jest/globals';
import Mdict from '../src/mdict';

describe('Mdict', () => {
  describe('Oxford', () => {
    const mdict = new Mdict(
      "resources/Oxford Advanced Learner's Dictionary 7th.mdx",
      {
        resort: true,
      }
    );
    // it('#associate&#parse_defination', () => {
    //   const matched = mdict.associate('on');
    //   expect(matched.length).toBeGreaterThan(0);
    //   expect(matched).toBeDefined();
    //   expect(matched[0]).toBeDefined();

    //   let defination = mdict.fetch_defination(matched[0]);

    //   expect(defination.definition).toMatch(
    //     /^<head><link rel="stylesheet" type="text\/css" href="O7\.css"\/>/
    //   );
    // });
    // it('#lookup', () => {
    //   const def = mdict.lookup('ask');
    //   expect(def.definition).not.toHaveLength(0);
    //   expect(def.keyText).toBe('ask');
    // });
    // it('#prefix', () => {
    //   const prefix = mdict.prefix('likewise');
    //   expect(Array.isArray(prefix)).toBe(true);
    //   expect(prefix).toHaveLength(1);
    // });

    // it('#fuzzy_search', () => {
    //   const result = mdict.fuzzy_search('incited', 5, 4);
    //   expect(Array.isArray(result)).toBe(true);
    //   expect(result).toHaveLength(5);
    // });
  });
});
