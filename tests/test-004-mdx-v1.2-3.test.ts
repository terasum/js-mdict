import { expect } from '@jest/globals';
import {MDX} from '../src/index.js';

describe('Mdict', () => {
  describe('Oxford', () => {
    const mdict = new MDX(
      './tests/data/oald7.mdx',
      {
        resort: true,
      }
    );
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('on');
      expect(matched).toBeDefined();
      expect(matched!.length).toBeGreaterThan(0);
      expect(matched).toBeDefined();
      expect(matched![0]).toBeDefined();

      const defination = mdict.fetch(matched![0]);

      expect(defination.definition).toMatch(
        /^<head><link rel="stylesheet" type="text\/css" href="O7\.css"\/>/
      );
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).not.toHaveLength(0);
      expect(def.keyText).toBe('ask');
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('likewise');
      expect(Array.isArray(prefix)).toBe(true);
      expect(prefix).toHaveLength(1);
    });

    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 4);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(5);
    });
  });
});
