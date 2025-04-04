import { MDX } from '../src';
import { expect } from '@jest/globals';

describe('tests mdx file v1.2', () => {
  describe('oald7.mdx', () => {
    const mdict = new MDX('./tests/data/oald7.mdx', {
      resort: true,
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).not.toHaveLength(0);
      expect(def.keyText).toBe('ask');
    });

    it('#prefix', () => {
      const list = mdict.prefix('recom');
      expect(list).toHaveLength(4);
      expect(list[0].keyText).toBe('recommence');
      expect(list[1].keyText).toBe('recommend');
      expect(list[2].keyText).toBe('recommendation');
    });

    it('#associate', () =>{
      const list = mdict.associate('recom');
      expect(list).toHaveLength(1206);
      expect(list).toBeDefined();
      expect(list[0].keyText).toBe('q.v.');
      expect(list[1].keyText).toBe('qualifier');
      expect(list[2].keyText).toBe('qualify');
    });

    it('#fuzzy_search', () =>{
      const list = mdict.fuzzy_search('recom', 3, 3);
      expect(list).toHaveLength(3);
      expect(list[0].keyText).toBe('recon');
      expect(list[1].keyText).toBe('re-form');
      expect(list[2].keyText).toBe('realm');
    });
  });
});
