'use strict';

var _testclass = require('./testclass');

var _testclass2 = _interopRequireDefault(_testclass);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

(() => {
  const test = new _testclass2.default(1, 2);
  console.log(test.toString());
})(); // var mdict = require("./index.js");

// (function(){
//     mdict("./testdict/ETDict.mdx").search("hello").then(function(defination){
//            console.log(defination);
//     });
// })();