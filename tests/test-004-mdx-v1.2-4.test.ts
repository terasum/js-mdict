import {MDX} from '../src';

describe('Mdict', () => {
  describe('Collins', () => {
    const mdict = new MDX(
      './tests/data/Collins.mdx',
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
          '<font size=+1 color=purple>-n\'t</font><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><link href="collins.css" rel="stylesheet" type="text/css" /></head><div class="tab_content" id="dict_tab_101" style="display:block"><div class="part_main"><div class="collins_content"><div class="collins_en_cn"><div class="caption"><span class="num">1.</span><span class="text_blue"></span>  <span class="text_gray" style="font-weight:bold;">→see: </span><b class="text_blue"><a class = "explain" href="entry://not">not</a></b>; </div><ul></ul></div></div></div></div>')
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
