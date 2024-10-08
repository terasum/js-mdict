import Mdict from '../src/mdict';
import { expect } from '@jest/globals';

describe('Mdict', () => {
  describe('Collins', () => {
    const mdict = new Mdict('test/data/Collins.mdd');
    it('#lookup', () => {
      const def = mdict.locate('\\collins.css');

      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('\\collins.css');
    });
  });
});
