"use strict";

var path = require('path');
var fs = require('fs');
var stacktrace = require('stack-trace');
var combine = require('../util.combine.js');

function getDirName()
{
	/* jshint validthis: true */
	return path.dirname(this.getFileName());
}

function getCaller()
{
	var stack = stacktrace.get(),
		i = 0,
		max = stack.length - 1,
		part,
		filename;

	// The first item in the trace is this call.
	stack.shift();

	for (; i < max; ++i)
	{
		part = stack[i];
		if (part.isEval() || part.isNative() || part.isToplevel())
			continue;

		filename = part.getFileName();
		if (filename === __filename || !(/^(\/|[a-z]:\\)/i).test(filename))
			continue;

		part.getDirName = getDirName;

		return part;
	}

	return null;
}

function callerContext(cb)
{
	var args = Array.prototype.slice.call(arguments, 1),
		caller = getCaller();

	if (caller == null)
		return cb.apply(global, [__filename, __dirname].concat(args));
	else
		return cb.apply(caller.getThis(), [caller.getFileName(), caller.getDirName()].concat(args));
}

function resourceOptions(filename, options)
{
	var opts = {},
		ext = path.extname(filename).toLowerCase().slice(1);

	if (/^(txt|json|js|md|html)$/.test(ext))
	{
		opts.encoding = 'utf8';
		opts.format = ext;
	}

	if (options instanceof Object)
		combine(opts, options);

	return opts;
}

function resourceParse(data, options)
{
	if (options.format === 'json')
		return JSON.parse(data);

	return data;
}

function resource(filename, options, callback)
{
	if (callback == null)
	{
		callback = options;
		options = null;
	}

	var caller = getCaller();
	if (caller)
		filename = path.resolve(caller.getDirName(), filename);
	else
		filename = path.resolve(__dirname, filename);

	options = resourceOptions(filename, options);

	fs.readFile(filename, options, function(err, data){
		callback(err, resourceParse(data, options));
	});
}

function resourceSync(filename, options)
{
	var caller = getCaller();
	if (caller)
		filename = path.resolve(caller.getDirName(), filename);
	else
		filename = path.resolve(__dirname, filename);

	options = resourceOptions(filename, options);

	return resourceParse(fs.readFileSync(filename, options), options);
}

exports.getCaller = getCaller;
exports.callerContext = callerContext;
exports.resource = resource;
exports.resourceSync = resourceSync;
