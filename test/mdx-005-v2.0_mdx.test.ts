import Mdict from '../src/mdict';

describe('Mdict', () => {
  describe('oale8.mdx', () => {
    const mdict = new Mdict('./test/data/oale8.mdx', { resort: true });
    it('#associate&#parse_defination', () => {
      const matched = mdict.associate('on');
      if (!matched) {
        throw new Error('no matched');
      }
      expect(matched.length > 0).toBeTruthy();
      expect(matched != undefined).toBeTruthy();
      expect(matched[0] != undefined).toBeTruthy();

      let defination = mdict.fetch_defination(matched[0]);
      if (!defination.definition) {
        throw new Error('no definition');
      }
      expect(
        defination.definition.startsWith(
          '<link rel="stylesheet" type="text/css" '
        )
      );
    });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('ask');
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('likewise');
      expect(prefix instanceof Array).toBeTruthy();
      expect(prefix.length).toEqual(1677);
    });

    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 5);
      expect(result instanceof Array).toBeTruthy();
      expect(result.length).toEqual(5);
    });
  });
});
