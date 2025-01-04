import lzo from './lzo1x.js';
function decompress(buf, initSize, blockSize) {
    const result = lzo.decompress({
        inputBuffer: buf,
        initSize: 16000,
        blockSize: 8192,
    });
    return result;
}
function compress(state) {
    return lzo.compress(state);
}
export { decompress, compress };
export default { decompress, compress };
//# sourceMappingURL=lzo1x-wrapper.js.map