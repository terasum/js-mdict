import { expect } from '@jest/globals';
import { MDX } from '../src';

describe('mdx-prefix-001', () => {
  const mdict = new MDX(
    './test/data/Collins.mdx',
    { resort: true }
  );

  it('prefix-001', () => {
    const item = mdict.prefix('apple');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }

  });
});
