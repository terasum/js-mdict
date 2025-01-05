import { expect } from '@jest/globals';
import { MDX } from '../src';

describe('mdx-lookup-key-block', () => {
  const mdict = new MDX(
    './tests/data/Collins.mdx',
    { resort: true }
  );

  it('suggest-01', () => {
    const item = mdict.fuzzy_search('apple', 3, 3);
    expect(item).toBeDefined();
    if (!item) {
      return;
    }
    expect(item.length).toEqual(3);
    console.log(item)


  });

});
