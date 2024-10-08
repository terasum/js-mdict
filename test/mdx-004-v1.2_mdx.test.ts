import Mdict from '../src/mdict';

describe('Mdict', () => {
  describe('Collins', () => {
    const mdict = new Mdict(
      "./test/data/Collins.mdx",
      { resort: true }
    );
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('on');
      if (!matched) {
        throw new Error('No matched word found');
      }
      expect(matched.length > 0).toBeTruthy();
      expect(matched != undefined).toBeTruthy();
      expect(matched[0] != undefined).toBeTruthy();

      let defination = mdict.fetch_defination(matched[0]);
      if (!defination.definition) {
        throw new Error('No definition found');
      }
      expect(
        defination.definition.startsWith(
          `<font size=+1 color=purple>on</font><font color=gold>`
        )
      ).toBeTruthy();
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('ask');
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('likewise');
      expect(prefix instanceof Array).toBeTruthy();
      expect(prefix.length).toEqual(1266);
    });

    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 5);
      expect(result).toBeDefined();
      expect(result.length).toEqual(5);
    });
  });
});
