"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require("fs");

var _fs2 = _interopRequireDefault(_fs);

var _Scanner = require("./Scanner");

var _Scanner2 = _interopRequireDefault(_Scanner);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Parser = function () {
  function Parser(file, ext) {
    _classCallCheck(this, Parser);

    this.file = file;
    this.ext = ext;
  }

  _createClass(Parser, [{
    key: "parse",
    value: function parse() {
      var _this = this;

      return new Promise(function (resolve, reject) {
        _this.buffer().then(function (buf) {
          _this.scanner = new _Scanner2.default(buf, _this.ext);
          // 1. get header length (4 -bytes)
          var headerSize = _this.scanner.readFileHeaderSize();
          // 2. read the size section
          var headerAttributes = _this.scanner.readHeaderSect(headerSize);
          var headerRemainLen = headerSize + 4;
          var keywordSummary = _this.scanner.readKeywordSummary(headerRemainLen);
          // keyword_index
          var keywordIndex = _this.scanner.readKeywordIndex(keywordSummary);
          // 开始读取 key Blocks 得到所有词
          var keyBlocks = _this.scanner.slice(_this.scanner.offset, keywordSummary.keyBlockLen);
          var keyList = _this.scanner.readKeyBlock(keywordIndex, keyBlocks);
          // 将offset 指针定位到 record 开始
          _this.scanner.forward(keywordSummary.keyBlockLen);
          var recordSection = _this.scanner.readRecordSect();
          var recordBlockTable = _this.scanner.readRecordBlock(recordSection);
          // promise resolve
          resolve({
            headerAttributes: headerAttributes,
            keywordSummary: keywordSummary,
            keywordIndex: keywordIndex,
            keyList: keyList,
            recordSection: recordSection,
            recordBlockTable: recordBlockTable,
            buffer: _this.scanner.buffer,
            ext: _this.ext
          });
        }).catch(function (err) {
          return reject(err);
        });
      });
    }
  }, {
    key: "buffer",
    value: function buffer(ofst, len) {
      var _this2 = this;

      return new Promise(function (_resolve, reject) {
        var offset = Number.parseInt(ofst, 10) || 0;
        _fs2.default.open(_this2.file, "r", function (err, fd) {
          if (err) {
            if (err.code === "ENOENT") {
              reject(new Error("file does not exist"));
            }
            reject(err);
          }
          var stats = _fs2.default.statSync(_this2.file);
          var length = Number.parseInt(len, 10) || stats.size;
          var buf = Buffer.alloc(length);
          _fs2.default.read(fd, buf, 0, length, offset, function (err2, bytesRead, buffer) {
            if (err2) {
              reject(err2);
            }
            _resolve(buffer);
          });
        });
      });
    }
  }]);

  return Parser;
}();

exports.default = Parser;