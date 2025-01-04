"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompress = decompress;
exports.compress = compress;
const lzo1x_js_1 = __importDefault(require("./lzo1x.js"));
function decompress(buf, initSize, blockSize) {
    const result = lzo1x_js_1.default.decompress({
        inputBuffer: buf,
        initSize: 16000,
        blockSize: 8192,
    });
    return result;
}
function compress(state) {
    return lzo1x_js_1.default.compress(state);
}
exports.default = { decompress, compress };
//# sourceMappingURL=lzo1x-wrapper.js.map