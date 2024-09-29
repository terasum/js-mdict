import { ripemd128 } from '../src/ripemd128';
import { expect } from '@jest/globals';

describe('mdict', () => {
  it('mdict1', () => {
    const input = new ArrayBuffer(0);
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0xcd, 0xf2, 0x62, 0x13, 0xa1, 0x50, 0xdc, 0x3e,
      0xcb, 0x61, 0x0f, 0x18, 0xf6, 0xb3, 0x8b, 0x46
    ]);
  });

});
