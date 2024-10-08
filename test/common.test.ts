import { expect } from '@jest/globals';
import common, { type NumFmt } from '../src/utils.js';

describe('common', () => {
  it('应该正确读取 uint32 数字', () => {
    const bytes = Buffer.from([0, 0, 4, 166]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT32 as NumFmt)).toBe(1190);
  });

  it('应该正确读取 uint64 数字', () => {
    const bytes = Buffer.from([0, 0, 4, 166, 1, 2, 3, 4]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      5111027991300
    );
  });

  it('应该正确读取 uint64 (2)', () => {
    const bytes = Buffer.from([0, 0, 4, 166, 0, 0, 1, 100]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      5111011082596
    );
  });

  it('应该正确读取 uint64 (3)', () => {
    const bytes = Buffer.from([0x00, 0x1f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      9007199254740991
    );
  });

  it('应该正确读取 uint64 (4)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x10, 0x00, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x1000000000
    );
  });

  it('应该正确读取 uint64 (5)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(0x01);
  });
  it('应该正确读取 uint64 (6)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x0100
    );
  });
  it('应该正确读取 uint64 (7)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x0100
    );
  });
  it('应该正确读取 uint64 (8)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x010000
    );
  });
  it('应该正确读取 uint64 (9)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x01000000
    );
  });
  it('应该正确读取 uint64 (10)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x0100000000
    );
  });
  it('应该正确读取 uint64 (11)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x010000000000
    );
  });
  it('应该正确读取 uint64 (12)', () => {
    const bytes = Buffer.from([0x00, 0x00, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x110000000000
    );
  });
  it('应该正确读取 uint64 (13)', () => {
    const bytes = Buffer.from([0x00, 0x01, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x01110000000000
    );
  });
  it('应该正确读取 uint64 (14)', () => {
    const bytes = Buffer.from([0x00, 0x11, 0x11, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x11110000000000
    );
  });
  it('应该正确读取 uint64 (15)', () => {
    const bytes = Buffer.from([0x00, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x11]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)).toBe(
      0x11111111111111
    );
  });
  it('应该在 uint64 数字超过 2^53 时抛出错误', () => {
    const bytes = Buffer.from([0x00, 0x20, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00]);
    expect(() =>
      common.readNumber(bytes, common.NUMFMT_UINT64 as NumFmt)
    ).toThrow('Error: uint64 larger than 2^53, JS may lost accuracy');
  });
  it('应该正确读取 uint16 (17)', () => {
    const bytes = Buffer.from([0x00, 0x20]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT16 as NumFmt)).toBe(0x20);
  });
  it('应该正确读取 uint16 (18)', () => {
    const bytes = Buffer.from([0x20, 0x20]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT16 as NumFmt)).toBe(
      0x2020
    );
  });

  it('应该正确读取 uint8 (19)', () => {
    const bytes = Buffer.from([0x1a]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT8 as NumFmt)).toBe(0x1a);
  });
  it('应该正确读取 uint8 (20)', () => {
    const bytes = Buffer.from([0x20]);
    expect(common.readNumber(bytes, common.NUMFMT_UINT8 as NumFmt)).toBe(0x20);
  });
});
