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

  it('locate-key-002', () => {
    const item = mdd.lookupKeyBlockByWord('\\uk_pron.png');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }

  });

  it('locate-key-003', () => {
    const item = mdd.lookupKeyBlockByWord('\\uk_pron.png');
    expect(item).toBeDefined();
    if (!item) {
      return;
    }

  });
});
