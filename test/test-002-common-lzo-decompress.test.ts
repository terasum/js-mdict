import fs from 'node:fs';

import { decompress } from '../src/lzo1x-wrapper.js';

describe('test decompress', () => {
  it('decomress data', () => {
    const infile = fs.readFileSync('./test/data/compressed.data');
    const data = decompress(infile, 0, 0);
    expect(data.length).toEqual(16341);
  });
});
