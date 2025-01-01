import {MDD} from '../src';
import { expect } from '@jest/globals';

describe('Mdict', () => {
  describe('Collins', () => {
    const mdict = new MDD('test/data/Collins.mdd');
    it('#lookup', () => {
      const def = mdict.locate('\\collins.css');

      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('\\collins.css');
    });
  });
});
