import { expect } from '@jest/globals';

import {MDX} from '../src';

describe('Mdict', () => {
  describe('#lookup', () => {
    const mdict = new MDX('./test/data/oald7.mdx', {
      passcode: '',
      debug: false,
      resort: true,
      isStripKey: true,
      isCaseSensitive: false,
    });
    it("should be 'micro'", () => {
      const def = mdict.lookup('micro');
      expect(typeof def.definition === 'string').toBeTruthy();
      expect(def).toBeDefined();
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(
        def.definition.startsWith( expect_str.trim())
      ).toBeTruthy();
    });
    it("should be 'introduction'", () => {
      const def = mdict.lookup('introduction');
      expect(typeof def.definition === 'string').toBeTruthy();
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      expect(def.definition.startsWith(expect_str.trim())).toBeTruthy();
    });
    it("should be 'dictionary'", () => {
      const def = mdict.lookup('dictionary');

      expect(typeof def.definition === 'string').toBeTruthy();
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      expect(def.definition.startsWith(expect_str.trim())).toBeTruthy();
    });
    it("should be 'ask'", () => {
      const def = mdict.lookup('ask');

      expect(typeof def.definition === 'string').toBeTruthy();
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      expect(def.definition.startsWith(expect_str.trim())).toBeTruthy();
    });
    it("should be 'vote'", () => {
      const def = mdict.lookup('vote');

      expect(typeof def.definition === 'string').toBeTruthy();
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      expect(def.definition.startsWith(expect_str.trim())).toBeTruthy();
    });
    it("should be 'good'", () => {
      const def = mdict.lookup('good');
      expect(def.definition !== null).toBeTruthy();
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      expect(def.definition.length > 0).toBeTruthy();
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(def.definition.startsWith(expect_str.trim())).toBeTruthy();
    });
    it("should be 'bad'", () => {
      const def = mdict.lookup('bad');
      expect(def.definition !== null).toBeTruthy();
      expect(def.definition).toBeDefined();

      if (!def.definition) {
        throw new Error('def.definition is undefined');
      }
      expect(def.definition.length > 0).toBeTruthy();
      const expect_str = '<head><link rel="stylesheet" type="text/css" href="O7.css"/>';
      expect(def.definition.startsWith(expect_str.trim())).toBeTruthy();
    });
  });
});
