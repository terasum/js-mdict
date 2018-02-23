const lzo1x = require("./lzo1x.js");

exports.decompress = (buf) => {
  const state = { inputBuffer: new Uint8Array(buf) };
  const ret = lzo1x.decompress(state);
  return state.outputBuffer;
};
