import {MDX} from '../src';

describe('Mdict', () => {
  describe('American Heritage', () => {
    const mdict = new MDX('./test/data/tahdel.mdx', {
      resort: true,
    });
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('bri');
      if (!matched) {
        throw new Error('No matched words found');
      }
      expect(matched.length > 0).toBeTruthy();
      expect(matched != undefined).toBeTruthy();
      expect(matched[0] != undefined).toBeTruthy();

      const def = mdict.fetch_definition(matched[0]);
      if (!def.definition) {
        throw new Error('No definition found');
      }

      expect(
        def.definition.startsWith(
          '<DIV id=main_wnd>\r\n<DIV style="PADDING-RIGHT: 10px; PADDING-LEFT: 10px; FONT-SIZE: 10.5pt; PADDING-BOTTOM: 0px; WIDTH: 100%; LINE-HEIGHT: 1.2em; PADDING-TOP: 10px; FONT-FAMILY: \'Tahoma\'" groupid="2">'
        )
      ).toBeTruthy();
    });

    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('ask');
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('hel');
      expect(prefix instanceof Array).toBeTruthy();
      expect(prefix.length).toEqual(76);
    });
    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 3);
      expect(result instanceof Array).toBeTruthy();
      expect(result.length).toEqual(5);
    });
  });
});
