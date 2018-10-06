"use strict";

var _bl = require("bl");

var _bl2 = _interopRequireDefault(_bl);

var _pythonStruct = require("python-struct");

var _pythonStruct2 = _interopRequireDefault(_pythonStruct);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var cluster = require("cluster");
var numCPUs = require("os").cpus().length;

function split_key_block_helper(keyBlocks, targetTaskNum) {
  var _this = this;

  // this._number_format, this._number_width, this._encoding;

  // TODO 多线程版本
  if (cluster.isMaster) {
    // master
    // 需要执行的任务数量
    var endTaskNum = 0;
    console.time("main");
    console.log("[master]# Master start runing. pid " + process.pid);
    var workers = [];
    for (var i = 0; i < numCPUs; i++) {
      var worker = cluster.fork();
      workers.push(worker);
    }
    for (var j = 0; j < targetTaskNum; j++) {
      console.log("[master]# send message to " + j % numCPUs + ": " + keyBlocks[j].length);
      workers[j % numCPUs].send(keyBlocks[j]);
    }

    // finished handler
    cluster.on("message", function (worker, message) {
      console.log("[master]# Worker " + worker.id + " finished: " + message);
      endTaskNum++;
      if (endTaskNum == targetTaskNum) {
        console.timeEnd("main");
        cluster.disconnect();
      }
    });
    // exit handler
    cluster.on("exit", function (worker, code, signal) {
      console.log("[master]# Worker " + worker.id + " died, " + code + ", " + signal);
    });
  } else {
    process.on("message", function (key_block) {
      console.log("[worker]# starts calculating");
      var start = Date.now();
      var splitedKey = _split_key_block(new _bl2.default(key_block), _this._number_format, _this._number_width, _this._encoding);
      console.log("[Worker]# The result of task " + process.pid + " is " + splitedKey.length + ", taking " + (Date.now() - start) + " ms.");
      // send message to main
      process.send(splitedKey);
    });
  }
}
// Note: for performance, this function will wrappered by
// a generator function, so this should return a Promise object
function _split_key_block(key_block, _number_format, _number_width, _encoding) {
  var key_list = [];
  var key_start_index = 0;
  var key_end_index = 0;
  // ------ debug start ----
  var count = 0;
  var skbt1 = new Date().getTime();
  // ------ debug ends ----
  while (key_start_index < key_block.length) {
    // nextline for debug
    count += 1;
    // const temp = key_block.slice(key_start_index, key_start_index + _number_width);
    // # the corresponding record's offset in record block
    var key_id = _pythonStruct2.default.unpack(_number_format, key_block.slice(key_start_index, key_start_index + _number_width))[0];
    // # key text ends with '\x00'
    var delimiter = void 0;
    var width = void 0;
    if (_encoding == "UTF-16") {
      delimiter = "0000";
      width = 2;
    } else {
      delimiter = "00";
      width = 1;
    }
    var i = key_start_index + _number_width;
    while (i < key_block.length) {
      if (new _bl2.default(key_block.slice(i, i + width)).toString("hex") == delimiter) {
        key_end_index = i;
        break;
      }
      i += width;
    }
    var key_text = this._decoder.decode(key_block.slice(key_start_index + _number_width, key_end_index));

    key_start_index = key_end_index + width;
    key_list.push([key_id, key_text]);

    // next line is for debug
    // break;
  }

  // ------ debug start ----
  var skbt2 = new Date().getTime();
  // console.log(`readKey#decodeKeyBlock#readOnce#loop#splitKey#splitKeyBlock counts ${count} times`);
  // console.log(`readKey#decodeKeyBlock#readOnce#loop#splitKey#splitKeyBlock used ${(skbt2 - skbt1) / 1000.0} s`);
  // ------ debug ends ----

  return key_list;
}