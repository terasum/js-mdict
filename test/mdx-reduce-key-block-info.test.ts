import { MDX } from '../src';

describe('mdx-reduce-word-key-block', () => {
  const mdict = new MDX(
    './test/data/Collins.mdx',
    { resort: true }
  );
  it('reduce-word-key-block-01', () => {
    const matched = mdict.lookupKeyInfoByWord('on');
    expect(mdict.keyInfoList[matched].firstKey).toEqual('nave');
    expect(mdict.keyInfoList[matched].lastKey).toEqual('ornate');
  });
  it('reduce-word-key-block-02', () => {
    const matched = mdict.lookupKeyInfoByWord('on site');
    expect(matched > 0).toBeTruthy();
    expect(mdict.keyInfoList[matched].firstKey).toEqual('nave');
    expect(mdict.keyInfoList[matched].lastKey).toEqual('ornate');
  });

  it('reduce-word-key-block-03', () => {
    const matched = mdict.lookupKeyInfoByWord('apple');
    expect(matched > 0).toBeTruthy();
    expect(mdict.keyInfoList[matched].firstKey).toEqual('aphasia');
    expect(mdict.keyInfoList[matched].lastKey).toEqual('beast of burden');
  });
  it('reduce-word-key-block-04', () => {
    const matched = mdict.lookupKeyInfoByWord('beast of');
    expect(matched > 0).toBeTruthy();
    expect(mdict.keyInfoList[matched].firstKey).toEqual('aphasia');
    expect(mdict.keyInfoList[matched].lastKey).toEqual('beast of burden');
  });
});
