import { Mdict } from '../src/index.js';
import { expect } from '@jest/globals';

describe('test mdx file v1.2', () => {
  describe('oald7.mdx', () => {
    const mdict = new Mdict('./test/data/oald7.mdx', {
      resort: true,
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).not.toHaveLength(0);
      expect(def.keyText).toBe('ask');
    });

    it('#prefix', () => {
      const list = mdict.prefix('recom');
      expect(list).toHaveLength(1206);
      expect(list[0].key).toBe('qualifier');
      expect(list[1].key).toBe('qualify');
      expect(list[2].key).toBe('qualitative');
    });

    it('#associate', () =>{
      const list = mdict.associate('recom');
      expect(list).toHaveLength(1206);
      expect(list).toBeDefined();
      expect(list![0].keyText).toBe('qualifier');
      expect(list![1].keyText).toBe('qualify');
      expect(list![2].keyText).toBe('qualitative');
    });

    it('#fuzzy_search', () =>{
      const list = mdict.fuzzy_search('recom', 3, 3);
      expect(list).toHaveLength(3);
      expect(list[0].key).toBe('race');
      expect(list[1].key).toBe('racer');
      expect(list[2].key).toBe('racism');
    });
  });
});
