"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _textEncoding = require("text-encoding");

const REGEXP_STRIPKEY = {
  mdx: /[()., '/\\@_-]()/g,
  mdd: /([.][^.]*$)|[()., '/\\@_-]/g // strip '.' before file extension that is keeping the last period
};

const UTF_16LE_DECODER = new _textEncoding.TextDecoder("utf-16le");
const UTF16 = "UTF-16";

function newUint8Array(buf, offset, len) {
  let ret = new Uint8Array(len);
  ret = Buffer.from(buf, offset, offset + len);
  return ret;
}

function readUTF16(buf, offset, length) {
  return UTF_16LE_DECODER.decode(newUint8Array(buf, offset, length));
}

function getExtension(filename, defaultExt) {
  return (/(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt
  );
}

exports.default = {
  getExtension,
  readUTF16,
  newUint8Array,
  REGEXP_STRIPKEY,
  UTF16
};