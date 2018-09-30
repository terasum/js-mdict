"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

/*
 * Create a Record Block Table object to load record block info from record section in mdx/mdd file.
 * Retrived data is stored in an Uint32Array
 * which contains N pairs of (offset_comp, offset_decomp) value,
 * where N is number of record blocks.
 *
 * When looking up a given key for its definition:
 *   1. Search KEY_INDEX to locate keyword block containing the given key.
 *   2. Scanning the found keyword block to get its record offset and size.
 *   3. Search RECORD_BLOCK_TABLE to get record block containing the record.
 *   4. Load the found record block, using its offset and size to retrieve record content.
 *
 * @see https://github.com/zhansliu/writemdict/blob/master/fileformat.md#record-section
 */
var RecordBlockTable = function () {
  function RecordBlockTable(len) {
    _classCallCheck(this, RecordBlockTable);

    this.pos = 0; // current position
    this.arr = new Uint32Array(len * 2); // backed Uint32Array
  }
  // Store offset pair value (compressed & decompressed) for a record block
  // NOTE: offset_comp is absolute offset counted from start of mdx/mdd file.


  _createClass(RecordBlockTable, [{
    key: "put",
    value: function put(offsetComp, offsetDecomp) {
      this.arr[this.pos++] = offsetComp;
      this.arr[this.pos++] = offsetDecomp;
    }

    // Given offset of a keyword after decompression, return a record block info containing it,
    // else undefined if not found.
    // fast binary search

  }, {
    key: "find",
    value: function find(keyAt) {
      // hi = arr.length/2 -1
      var hi = (this.arr.length >> 1) - 1;
      var lo = 0;
      // i = (lo + hi) /2
      var i = lo + hi >> 1;
      // val = arr[i*2 +1]
      var val = this.arr[(i << 1) + 1];
      // out of range
      if (keyAt > this.arr[(hi << 1) + 1] || keyAt < 0) {
        return null;
      }

      while (true) {
        if (hi - lo <= 1) {
          if (i < hi) {
            var ret = {
              block_no: i,
              comp_offset: this.arr[i <<= 1],
              comp_size: this.arr[i + 2] - this.arr[i],
              decomp_offset: this.arr[i + 1],
              decomp_size: this.arr[i + 3] - this.arr[i + 1]
            };
            return ret;
          }
          return null;
        }

        if (keyAt < val) {
          hi = i;
        } else {
          lo = i;
        }
        i = lo + hi >> 1;
        val = this.arr[(i << 1) + 1];
      }
    }
  }]);

  return RecordBlockTable;
}();

exports.default = RecordBlockTable;