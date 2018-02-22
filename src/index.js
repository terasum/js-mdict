/**
 *  var medict = new MeDict('./testdict/Collins.mdx');
 * var foundwords = medict.search({
 * 		        phrase: "hello",
 * 		        max: 10
 *           });
 * foundwords.then(function(definitions){
 *              console.log(definitions);
 *              return definitions
 *  });
 */

var mdict = require('./mdict.js');
var isNode = require('detect-node');
//const dict = mdict.dictionary('./testdict/Collins.mdx')
function MDictByName(file) {
    this.dictionary = mdict.dictionary(file);
    this.search = function (word) {
        //// dictionary is loaded
        return this.dictionary.then(function (dict) {
            return dict.search(word).then(function (foundWords) {
                var word = '' + foundWords[0];
                return dict.lookup(word); /// typeof word === string
            })
        });

    }
}

function MDictByFile(file) {
        var me =  mdict.dictionaryByFile(file);
        return me;
}

// medict = mdict.dictionaryByFile(file);
// medict.then(function (dict) {
//  var foundwords = dict.search({
//         phrase: "hello",
//         max: 10
//     });
//     foundwords.then(function(foundWords){
//         var word = '' + foundWords[0];
//         return dict.lookup(word).then(cb); /// typeof word === string
//     });
// })


module.exports = function(file,cb){
    if (isNode){
        return new MDictByName(file);
    }else{
        return MDictByFile(file,cb);
    }
}
