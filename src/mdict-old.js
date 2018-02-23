/**
 *  https://github.com/jeka-kiselyov/mdict
 *  Very rude refactoring of https://github.com/fengdh/mdict-js to make it work with node.js by Jeka Kiselyov ( https://github.com/jeka-kiselyov ).
 *  Done enough to make it work for my project(with predefined dictionaries). Though tested with few .mdx files only. 
 *  There may be some bugs for other dictionaries. Please check.
 *  Please feel free to post pull requests with optimizations, unit tests etc.
 *  Released under terms of the MIT License, as original library
 */
/**
 * Usage:
 *  var mdict = require('mdict');
 *  
 *	mdict.dictionary('dehkhoda.mdx').then(function(dictionary){
 * 		//// dictionary is loaded
 *		dictionary.search({
 *			phrase: 'دهخدا*', 
 *			max: 10
 * 		}).then(function(foundWords){
 *			console.log('Found words:');
 *			console.log(foundWords);
 *
 *			var word = ''+foundWords[0];
 *			console.log('Loading definitions for: '+word);
 *			return dictionary.lookup(word); /// typeof word === string
 *		}).then(function(definitions){
 *			console.log('definitions:');
 *			console.log(definitions);
 *		});
 *		
 *	});
 */
var mdictParser = require('./mdict-parser.js');
var Promise = require('bluebird');
var _ = require('lodash');

exports.dictionary = function(filenames) {
	if (!Array.isArray(filenames)) {
		filenames = [filenames];
	}

	return new Promise(function(resolve, reject){
		mdictParser.load(filenames).then(function(resources){
			if (_.isArray(resources)){
				return resources[0];
			}
			return resources.mdx;
		}).then(function(mdx){
			resolve({
				lookup: function(string) {
					return mdx(string);
				},
				search: function(params) {
			        if (typeof params === 'string' || params instanceof String) {
			        	params = {
			        		phrase: params
			        	};
			        }

					params = params || {};
					params.phrase = params.phrase || '';
					params.max = params.max || 10;
					params.follow = params.follow || false;

					return mdx(params);
				}
			});
		});
	});
};

exports.dictionaryByFile = function(file){
	if (!file || !file instanceof Blob){
		throw new Error("the argument 1 should be a Blob instance");
	}
	return new Promise(function(resolve, reject){
		mdictParser.load(file).then(
			function(resources){
				if(!resources.mdx){
					if (_.isArray(resources)){
					   return resources[0];
					}
					return resources;
				}
				console.log(resources);
				return resources.mdx;
		}).then(function(mdx){
			resolve({
				lookup: function(string) {
					return mdx(string);
				},
				search: function(params) {
			        if (typeof params === 'string' || params instanceof String) {
			        	params = {
			        		phrase: params
			        	};
			        }
					params = params || {};
					params.phrase = params.phrase || '';
					params.max = params.max || 10;
					params.follow = params.follow || false;

					return mdx(params);
				}
			});
		});
	});
}