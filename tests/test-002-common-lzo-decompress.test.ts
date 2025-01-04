import fs from 'node:fs';

import { decompress } from '../src/lzo1x-wrapper.js';

describe('tests decompress', () => {
  it('decomress data', () => {
    const infile = fs.readFileSync('./tests/data/compressed.data');
    const data = decompress(infile, 0, 0);
    expect(data.length).toEqual(16341);
  });
});
