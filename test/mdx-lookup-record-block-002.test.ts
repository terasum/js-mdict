import Mdict from '../src/mdict';
import { expect } from '@jest/globals';
import { MDD } from '../src';

describe('mdx-lookup-key-block-003', () => {
  const mdict = new Mdict(
    './test/data/oald7.mdx',
    { resort: true }
  );
  const mdd = new MDD(
    './test/data/oale8.mdd',
    { resort: true }
  );
  it('lookup-key-block-003-01', () => {
    const item = mdict.lookupKeyBlockByWord('apple');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }
    expect(item.keyText).toEqual('apple');
    expect(item.recordStartOffset).toEqual(2298939);
    expect(item.keyBlockIdx).toEqual(1);
    const meaning = mdict.lookupRecordByKeyBlock(item);
    expect(meaning.length).toBeGreaterThan(200);
    console.log(meaning);

  });

  it('lookup-key-block-003-02', () => {
    const item = mdd.lookupKeyBlockByWord('\\collins.css');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }
    expect(item.keyText).toEqual('\\Logo.jpg');
    expect(item.recordStartOffset).toEqual(14340);
    expect(item.keyBlockIdx).toEqual(0);
    const meaning = mdd.lookupRecordByKeyBlock(item);
    expect(meaning.length).toBeGreaterThan(200);
    console.log(meaning.slice(0, 100));

  });
});
