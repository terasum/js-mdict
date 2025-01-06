import { expect } from '@jest/globals';
import { MDD } from '../src';

describe('mdx-lookup-key-block', () => {

  const mdd = new MDD(
    './tests/data/oale8.mdd',
    { resort: true }
  );

  it('locate-key-001', () => {
    const item = mdd.lookupKeyBlockByWord('\\oalecd8e.css');
    expect(item).toBeUndefined();
    if (!item) {
      return;
    }

  });
});
