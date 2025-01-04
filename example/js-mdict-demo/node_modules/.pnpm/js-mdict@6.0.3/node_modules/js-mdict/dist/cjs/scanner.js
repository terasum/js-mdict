"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileScanner = void 0;
const node_fs_1 = require("node:fs");
class FileScanner {
    constructor(filepath) {
        this.filepath = filepath;
        this.offset = 0;
        this.fd = (0, node_fs_1.openSync)(filepath, 'r');
    }
    close() {
        if (this.fd == 0) {
            return;
        }
        (0, node_fs_1.closeSync)(this.fd);
    }
    readBuffer(offset, length) {
        const buffer = new Uint8Array(length);
        const readedLen = (0, node_fs_1.readSync)(this.fd, buffer, {
            offset: 0, // here offset means the data will write into buffer's offset
            length: length,
            position: offset, // here the offset is the file's start read position
        });
        return buffer.slice(0, readedLen);
    }
    readNumber(offset, length) {
        const buffer = new ArrayBuffer(length);
        const dataView = new DataView(buffer);
        (0, node_fs_1.readSync)(this.fd, dataView, {
            length: length,
            position: offset,
            offset: 0,
        });
        return dataView;
    }
}
exports.FileScanner = FileScanner;
//# sourceMappingURL=scanner.js.map