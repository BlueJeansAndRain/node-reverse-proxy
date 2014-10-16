"use strict";

var core = require('./jscore');
var net = require('net');

exports.normalize = core.fn.overload(
{
	args: [
		["number", "string", "object"],
		{ type: "boolean", optional: true, _: false}
	],
	call: function(options, showSecure)
	{
		if (typeof options === 'number')
			options = { port: options };
		else if (typeof options === 'string')
			options = { path: options };

		if (typeof options.port === 'number')
		{
			if (options.port % 1 !== 0)
				throw new Error("expecting integer");
			else if (options.port < 1 || options.port > 65535)
				throw new Error("port out of range");

			if (options.host != null)
			{
				if (!net.isIP(options.host))
					throw new Error("invalid host");

				if (showSecure)
					return [options.port, options.host, !!options.secure];
				else
					return [options.port, options.host];
			}

			if (showSecure)
				return [options.port, !!options.secure];
			else
				return [options.port];
		}

		if (typeof options.path !== 'string')
			throw new Error("expecting port or path");

		if (showSecure)
			return [options.path, !!options.secure];
		else
			return [options.path];
	}
});

exports.pretty = core.fn.overload(
{
	args: [
		{ type: "boolean", optional: true, _: true },
		"array"
	],
	call: function(showSecure, args)
	{
		return exports.pretty.apply(exports, [showSecure].concat(args));
	}
},
{
	args: [
		{ type: "boolean", optional: true, _: true },
		"object"
	],
	call: function(showSecure, options)
	{
		return exports.pretty.apply(exports, exports.normalize(options, showSecure));
	}
},
{
	args: [
		{ type: "boolean", optional: true, _: true },
		"number",
		{ type: "string", optional: true },
		{ type: "boolean", optional: true, _: false }
	],
	call: function(showSecure, port, host, secure)
	{
		var str = "port: " + port;
		if (host)
			str += ", host: " + host;
		if (showSecure)
			str += ", secure: " + secure;

		return str;
	}
},
{
	args: [
		{ type: "boolean", optional: true, _: true },
		"string",
		{ type: "boolean", optional: true, _: false }
	],
	call: function(showSecure, path, secure)
	{
		var str = "path: " + path;
		if (showSecure)
			str += ", secure: " + secure;

		return str;
	}
});
