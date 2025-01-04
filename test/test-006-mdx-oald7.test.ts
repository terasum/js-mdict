import { MDX } from '../src';
import { expect } from '@jest/globals';

describe('test mdx file v1.2', () => {
  describe('oald7.mdx', () => {
    const mdict = new MDX('./test/data/oald7.mdx', {
      resort: true,
    });
    it('#lookup', () => {
      const def = mdict.lookup('arose');
      expect(def.definition).not.toHaveLength(0);
      expect(def.keyText).toBe('arose');
      if (!def.definition){
        throw new Error('No such definition');
      }
      expect(def.definition.length).toBeGreaterThan(200);
    });

  });
});
