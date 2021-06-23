import { assert } from 'chai';
import Mdict from '../src/mdict';

describe('Mdict', () => {
  describe('oale8.mdx', () => {
    const mdict = new Mdict('mdx/testdict/oale8.mdx');
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('on');
      assert.isTrue(matched.length > 0);
      assert.isTrue(matched != undefined);
      assert.isTrue(matched[0] != undefined);

      let defination = mdict.parse_defination(
        matched[0].keyText,
        matched[0].recordStartOffset
      );

      assert.isTrue(
        defination.definition.startsWith(
          '<link rel="stylesheet" type="text/css" '
        )
      );
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      assert.isNotEmpty(def.definition);
      assert.equal(
        def.keyText,
        'ask',
        'definition result should be equal with `ask`'
      );
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('likewise');
      assert.isArray(prefix);
      assert.equal(
        prefix.length,
        2,
        'definition result.length should be equal with 2'
      );
    });
    it('#suggest', async () => {
      const result = await mdict.suggest('informations');
      assert.isArray(result);
      assert.equal(
        result.length,
        2,
        'prefix result.length should be equal with 2'
      );
    });

    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 5);
      assert.isArray(result);
      assert.equal(
        result.length,
        6,
        'fuzzy_search result.length should be equal with 6'
      );
    });
  });
});
