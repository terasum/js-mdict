import { ripemd128 } from '../src/ripemd128.js';
import { expect } from '@jest/globals';

describe('ripemd128', () => {
  it('应该正确计算空字符串的哈希值', () => {
    const input = new ArrayBuffer(0);
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0xcd, 0xf2, 0x62, 0x13, 0xa1, 0x50, 0xdc, 0x3e,
      0xcb, 0x61, 0x0f, 0x18, 0xf6, 0xb3, 0x8b, 0x46
    ]);
  });

  it('应该正确计算"a"的哈希值', () => {
    const input = new TextEncoder().encode('a').buffer;
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0x86, 0xbe, 0x7a, 0xfa, 0x33, 0x9d, 0x0f, 0xc7,
      0xcf, 0xc7, 0x85, 0xe7, 0x2f, 0x57, 0x8d, 0x33
    ]);
  });

  it('应该正确计算"abc"的哈希值', () => {
    const input = new TextEncoder().encode('abc').buffer;
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0xc1, 0x4a, 0x12, 0x19, 0x9c, 0x66, 0xe4, 0xba,
      0x84, 0x63, 0x6b, 0x0f, 0x69, 0x14, 0x4c, 0x77
    ]);
  });

  it('应该正确计算"message digest"的哈希值', () => {
    const input = new TextEncoder().encode('message digest').buffer;
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0x9e, 0x32, 0x7b, 0x3d, 0x6e, 0x52, 0x30, 0x62,
      0xaf, 0xc1, 0x13, 0x2d, 0x7d, 0xf9, 0xd1, 0xb8
    ]);
  });

  it('应该正确计算"abcdefghijklmnopqrstuvwxyz"的哈希值', () => {
    const input = new TextEncoder().encode('abcdefghijklmnopqrstuvwxyz').buffer;
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0xfd, 0x2a, 0xa6, 0x07, 0xf7, 0x1d, 0xc8, 0xf5,
      0x10, 0x71, 0x49, 0x22, 0xb3, 0x71, 0x83, 0x4e
    ]);
  });

  it('应该正确计算"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"的哈希值', () => {
    const input = new TextEncoder().encode('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789').buffer;
    const result = ripemd128(input);
    expect(Array.from(result)).toEqual([
      0xd1, 0xe9, 0x59, 0xeb, 0x17, 0x9c, 0x91, 0x1f,
      0xae, 0xa4, 0x62, 0x4c, 0x60, 0xc5, 0xc7, 0x02
    ]);
  });
});
