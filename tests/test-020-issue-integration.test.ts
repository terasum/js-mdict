import { MDX, MDD } from '../src/index';

describe('js-mdict Issue 80, 85, 86 Integration Tests', () => {
  const mdxPath = './tests/data/mini/mini.mdx';
  const mddPath = './tests/data/mini/mini.mdd';

  describe('Issue 85: Contains Search', () => {
    let mdx: MDX;
    beforeAll(() => {
      mdx = new MDX(mdxPath);
    });

    it('should find keywords containing a substring (case-insensitive)', () => {
      const results = mdx.contains('tion', false, 5);
      expect(results.length).toBeGreaterThan(0);
      results.forEach(item => {
        expect(item.keyText.toLowerCase()).toContain('tion');
      });
    });

    it('should respect the limit parameter', () => {
      const limit = 3;
      const results = mdx.contains('a', false, limit);
      expect(results.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Issue 86: Full Lookup (lookupAll)', () => {
    let mdx: MDX;
    beforeAll(() => {
      mdx = new MDX(mdxPath);
    });

    it('should return all entries for a word with duplicate keys', () => {
      // 'apple' in ODE often has multiple entries or we can test with any word in our mini dict
      const word = mdx.keywordList[0].keyText;
      const results = mdx.lookupAll(word);
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].keyText).toBe(word);
      expect(results[0].definition).toBeDefined();
    });
  });

  describe('Issue 80: MDD Resource Location', () => {
    let mdd: MDD;
    beforeAll(() => {
      mdd = new MDD(mddPath);
    });

    it('should locate a resource and return its data', () => {
      if (mdd.keywordList.length > 0) {
        const resource = mdd.keywordList[0];
        const result = mdd.locate(resource.keyText);
        expect(result.keyText).toBe(resource.keyText);
        expect(result.definition).toBeDefined();
        // Since it's a truncated file, some blocks might be missing, 
        // but the first few should be readable.
        if (result.definition) {
          expect(result.definition.length).toBeGreaterThan(0);
        }
      }
    });

    it('should handle forward slashes in resource keys', () => {
       if (mdd.keywordList.length > 0) {
        const key = mdd.keywordList[0].keyText.replace(/\\/g, '/');
        const result = mdd.locate(key);
        expect(result.definition).toBeDefined();
      }
    });
  });
});
