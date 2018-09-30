"use strict";

var _lzo1x = require("./lzo1x");

var _lzo1x2 = _interopRequireDefault(_lzo1x);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function decompress(buf /* , bufInitSize, bufBlockSize */) {
  var state = { inputBuffer: new Uint8Array(buf) };
  console.log(_lzo1x2.default);
  _lzo1x2.default.decompress(state);
  return state.outputBuffer;
}

module.exports.decompress = decompress;