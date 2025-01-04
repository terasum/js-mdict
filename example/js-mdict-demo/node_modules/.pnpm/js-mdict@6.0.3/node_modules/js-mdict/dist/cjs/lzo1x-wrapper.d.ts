declare function decompress(buf: Uint8Array, initSize: number, blockSize: number): any;
declare function compress(state: {
    inputBuffer: Uint8Array;
    outBuffer: Uint8Array;
}): any;
export { decompress, compress };
declare const _default: {
    decompress: typeof decompress;
    compress: typeof compress;
};
export default _default;
