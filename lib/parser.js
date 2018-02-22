"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

class Parser {
  constructor(file) {
    this.file = file;
  }

  buffer(ofst, len) {
    return new Promise((_resolve, reject) => {
      const offset = Number.parseInt(ofst, 10) || 0;
      const length = Number.parseInt(len, 10) || this.file.size - 1;

      _fs2.default.open(this.file, "r", (err, fd) => {
        if (err) {
          if (err.code === "ENOENT") {
            reject(new Error("file does not exist"));
          }
          reject(err);
        }
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