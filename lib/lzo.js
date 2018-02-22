'use strict';

var lzo1x = require('./lzo1x.js');

exports.decompress = function (buf) {
	var state = { inputBuffer: new Uint8Array(buf) };
	var ret = lzo1x.decompress(state);
	return state.outputBuffer;
};