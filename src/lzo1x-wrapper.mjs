// @ts-nocheck
import lzo from './lzo1x.js';

function decompress(
  buf,
  initSize,
  blockSize
) {
  result = lzo.decompress(buf, { initSize: 16000, blockSize: 8192 });
  return result;
}

function compress(buf)  {
  console.log("-------")
  return lzo.compress(buf);
}

export { decompress, compress };
export default { decompress, compress };
