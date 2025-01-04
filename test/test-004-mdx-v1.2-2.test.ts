import {MDX} from '../src';

describe('Mdict', () => {
  describe('Oxford', () => {
    const mdict = new MDX('./test/data/oald7.mdx', {
      resort: true,
    });
    // it("#associate&#parse_defination", () => {
    //   const matched = mdict.associate("on");
    //   assert.isTrue(matched.length > 0);
    //   assert.isTrue(matched != undefined);
    //   assert.isTrue(matched[0] != undefined);

    //   let defination = mdict.fetch_defination(matched[0]);

    //   assert.isTrue(
    //     defination.definition.startsWith(
    //       `<head><link rel=\"stylesheet\" type=\"text/css\" href=\"O7.css\"/>`
    //     )
    //   );
    // });
    it('#lookup', () => {
      const def = mdict.lookup('ask');
      expect(def.definition).toBeDefined();
      expect(def.keyText).toEqual('ask');
    });
    it('#prefix', () => {
      const prefix = mdict.prefix('like');
      expect(prefix).toBeDefined();
      expect(prefix.length).toEqual(9);
    });

    it('#fuzzy_search', () => {
      const result = mdict.fuzzy_search('incited', 5, 4);
      expect(result).toBeDefined();
      expect(result.length).toEqual(5);
    });
  });
});
