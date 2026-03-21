import { MDX, MDD } from '../src/index';
import path from 'path';

describe('js-mdict Internal Test Dictionaries Integration', () => {
  const dictDir = path.join(__dirname, 'data', 'freemdict');

  const testMdxFiles = [
    { name: 'internal_test_audio.mdx', testWord: 'test' },
    { name: 'internal_test_bilingual.mdx', testWord: 'test' },
    { name: 'internal_test_en_zh.mdx', testWord: 'test' },
    { name: 'internal_test_collocation.mdx', testWord: 'test' },
    { name: 'internal_test_zh_cn.mdx', testWord: '的' },
    { name: 'internal_test_synonym.mdx', testWord: 'test' },
    { name: 'internal_test_idiom.mdx', testWord: 'test' },
    { name: 'internal_test_phrasal.mdx', testWord: 'test' }
  ];

  const testMddFiles = [
    'internal_test_audio.mdd',
    'internal_test_bilingual.mdd',
    'internal_test_collocation.mdd',
    'internal_test_synonym.mdd',
    'internal_test_phrasal.mdd'
  ];

  describe('MDX Loading and Lookup', () => {
    testMdxFiles.forEach(({ name, testWord }) => {
      it(`should correctly load and lookup word in ${name}`, () => {
        const mdxPath = path.join(dictDir, name);
        const mdx = new MDX(mdxPath);
        expect(mdx.header).toBeDefined();
        
        const result = mdx.lookup(testWord);
        expect(result).toBeDefined();
        expect(result.definition).toBeDefined();
        if (result.definition) {
          expect(result.definition.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('MDD Loading and Resource Extraction', () => {
    testMddFiles.forEach((name) => {
      it(`should correctly load and extract resource from ${name}`, () => {
        const mddPath = path.join(dictDir, name);
        const mdd = new MDD(mddPath);
        expect(mdd.header).toBeDefined();
        expect(mdd.keywordList.length).toBeGreaterThan(0);

        const firstKey = mdd.keywordList[0].keyText;
        const result = mdd.locate(firstKey);
        expect(result).toBeDefined();
        expect(result.definition).toBeDefined();
        if (result.definition) {
          expect(result.definition.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Functional Regression: Contains and lookupAll on internal data', () => {
    it('should support contains() on internal_test_zh_cn.mdx', () => {
      const mdx = new MDX(path.join(dictDir, 'internal_test_zh_cn.mdx'));
      const results = mdx.contains('中', false, 5);
      expect(results.length).toBeGreaterThan(0);
    });

    it('should support lookupAll() on internal_test_audio.mdx', () => {
      const mdx = new MDX(path.join(dictDir, 'internal_test_audio.mdx'));
      const word = mdx.keywordList[10].keyText;
      const results = mdx.lookupAll(word);
      expect(results.length).toBeGreaterThan(0);
    });
  });
});
