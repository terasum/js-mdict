"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _Scanner = require("./Scanner");

var _Scanner2 = _interopRequireDefault(_Scanner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Parser {
  constructor(file, ext) {
    this.file = file;
    this.ext = ext;
  }

  parse() {
    return new Promise((resolve, reject) => {
      this.buffer().then(buf => {
        this.scanner = new _Scanner2.default(buf, this.ext);
        // 1. get header length (4 -bytes)
        const headerSize = this.scanner.readFileHeaderSize();
        // 2. read the size section
        const headerAttributes = this.scanner.readHeaderSect(headerSize);
        const headerRemainLen = headerSize + 4;
        const keywordSummary = this.scanner.readKeywordSummary(headerRemainLen);
        // keyword_index
        const keywordIndex = this.scanner.readKeywordIndex(keywordSummary);
        // 开始读取 key Blocks 得到所有词
        const keyBlocks = this.scanner.slice(this.scanner.offset, keywordSummary.keyBlockLen);
        const keyList = this.scanner.readKeyBlock(keywordIndex, keyBlocks);
        // 将offset 指针定位到 record 开始
        this.scanner.forward(keywordSummary.keyBlockLen);
        const recordSection = this.scanner.readRecordSect();
        const recordBlockTable = this.scanner.readRecordBlock(recordSection);
        // promise resolve
        resolve({
          headerAttributes,
          keywordSummary,
          keywordIndex,
          keyList,
          recordSection,
          recordBlockTable,
          buffer: this.scanner.buffer,
          ext: this.ext
        });
      }).catch(err => reject(err));
    });
  }

  buffer(ofst, len) {
    return new Promise((_resolve, reject) => {
      const offset = Number.parseInt(ofst, 10) || 0;
      _fs2.default.open(this.file, "r", (err, fd) => {
        if (err) {
          if (err.code === "ENOENT") {
            reject(new Error("file does not exist"));
          }
          reject(err);
        }
        const stats = _fs2.default.statSync(this.file);
        const length = Number.parseInt(len, 10) || stats.size;
        const buf = Buffer.alloc(length);
        _fs2.default.read(fd, buf, 0, length, offset, (err2, bytesRead, buffer) => {
          if (err2) {
            reject(err2);
          }
          _resolve(buffer);
        });
      });
    });
  }
}
exports.default = Parser;