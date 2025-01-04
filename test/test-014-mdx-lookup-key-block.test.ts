import Mdict from '../src/mdict';
import { expect } from '@jest/globals';
import { MDD } from '../src';

describe('mdx-lookup-key-block', () => {
  const mdict = new Mdict(
    './test/data/Collins.mdx',
    { resort: true }
  );
  const mdd = new MDD(
    './test/data/Collins.mdd',
    { resort: true }
  );
  it('lookup-key-block-01', () => {
    const item = mdict.lookupKeyBlockByWord('apple');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }
    expect(item.keyText).toEqual('apple');
    expect(item.recordStartOffset).toEqual(2026983);
    expect(item.keyBlockIdx).toEqual(1);


  });

  it('lookup-key-block-02', () => {
    const item = mdd.lookupKeyBlockByWord('\\collins.css');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }
    expect(item.keyText).toEqual('\\collins.css');
    expect(item.recordStartOffset).toEqual(0);
    expect(item.keyBlockIdx).toEqual(0);

  });
});
