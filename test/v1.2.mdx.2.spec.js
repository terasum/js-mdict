import { assert } from 'chai';
import Mdict from '../src/mdict';

describe('Mdict', () => {
  describe('American Heritage', () => {
    const mdict = new Mdict(
      'mdx/testdict/v1.2/The American Heritage Dictionary of English Language/The American Heritage Dictionary of English Language.mdx'
    );
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('bri');
      assert.isTrue(matched.length > 0);
      assert.isTrue(matched != undefined);
      assert.isTrue(matched[0] != undefined);

      let defination = mdict.parse_defination(
        matched[0].keyText,
        matched[0].recordStartOffset
      );

      assert.isTrue(
        defination.definition.startsWith(
          `<DIV id=main_wnd>\r\n<DIV style=\"PADDING-RIGHT: 10px; PADDING-LEFT: 10px; FONT-SIZE: 10.5pt; PADDING-BOTTOM: 0px; WIDTH: 100%; LINE-HEIGHT: 1.2em; PADDING-TOP: 10px; FONT-FAMILY: 'Tahoma'\" groupid=\"2\">`
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
        3,
        'definition result.length should be equal with 3'
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
        4,
        'fuzzy_search result.length should be equal with 4'
      );
    });
  });
});
