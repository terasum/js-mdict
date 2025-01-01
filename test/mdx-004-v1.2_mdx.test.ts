import {MDX} from '../src';

describe('Mdict', () => {
  describe('Collins', () => {
    const mdict = new MDX(
      './test/data/Collins.mdx',
      { resort: true }
    );
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('on');
      if (!matched) {
        throw new Error('No matched word found');
      }
      expect(matched.length > 0).toBeTruthy();
      expect(matched[0] != undefined).toBeTruthy();

      const def = mdict.fetch_definition(matched[0]);
      if (!def.definition) {
        throw new Error('No definition found');
      }
      expect(
        def.definition.startsWith(
          '<font size=+1 color=purple>nave</font><head><meta http-equiv="Content-Type" content="text/html;'
        )
      ).toBeTruthy();
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('ask');
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('like');
      expect(prefix instanceof Array).toBeTruthy();
      expect(prefix.length).toEqual(8);
    });

    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 5);
      expect(result).toBeDefined();
      expect(result.length).toEqual(5);
    });
  });
});
