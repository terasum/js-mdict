'use strict';

exports.REGEXP_STRIPKEY = {
	'mdx': /[()., '/\\@_-]()/g,
	'mdd': /([.][^.]*$)|[()., '/\\@_-]/g // strip '.' before file extension that is keeping the last period
};

exports.log = function () {
	console.log.apply(console, [].slice.apply(arguments));
};

exports.getExtension = function (filename, defaultExt) {
	return (/(?:\.([^.]+))?$/.exec(filename)[1] || defaultExt
	);
};