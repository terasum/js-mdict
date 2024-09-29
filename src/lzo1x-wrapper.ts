// @ts-nocheck
import lzo from './lzo1x.js';

function decompress(buf: Buffer, initSize: number, blockSize: numer) {
  const result = lzo.decompress({
    inputBuffer: buf,
    initSize: 16000,
    blockSize: 8192,
  });
  return result;
}

function compress(buf) {
  console.log('-------');
  return lzo.compress(buf);
}

export { decompress, compress };
export default { decompress, compress };
