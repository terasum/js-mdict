import {MDD} from '../src';
import { expect } from '@jest/globals';

describe('Mdict', () => {
  describe('oale8.mdd', () => {
    const mdict = new MDD('./tests/data/oale8.mdd', { resort: true });

    it('#lookup>\\uk_pron.png', () => {
      const def = mdict.locate('\\uk_pron.png');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('\\uk_pron.png');
    });

    it('#lookup>\\us_pron.png', () => {
      const def = mdict.locate('\\us_pron.png');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('\\us_pron.png');
    });

    it('#lookup>\\thumb\\ragdoll.jpg', () => {
      const def = mdict.locate('\\thumb\\ragdoll.jpg');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('\\thumb\\ragdoll.jpg');
    });

    it('#lookup>\\us\\zebra__us_2.mp3', () => {
      const def = mdict.locate('\\us\\zebra__us_2.mp3');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('\\us\\zebra__us_2.mp3');
    });
  });
});
