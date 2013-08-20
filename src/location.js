"use strict";

var core = require('jscore');
var net = require('net');

exports.normalize = core.fn.overload(
{
	args: [
		["number", "string", "object"],
		{ type: "boolean", optional: true, _: false}
	],
	call: function(options, keepSecure)
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

				if (keepSecure)
					return [options.port, options.host, !!options.secure];
				else
					return [options.port, options.host];
			}

			if (keepSecure)
				return [options.port, !!options.secure];
			else
				return [options.port];
		}

		if (typeof options.path !== 'string')
			throw new Error("expecting port or path");

		if (keepSecure)
			return [options.path, !!options.secure];
		else
			return [options.path];
	}
});

exports.pretty = core.fn.overload(
{
	args: "array",
	call: function(args)
	{
		return exports.pretty.apply(exports, args);
	}
},
{
	args: [
		"object",
		{ type: "boolean", optional: true, _: false }
	],
	call: function(options, keepSecure)
	{
		return exports.pretty.apply(exports, exports.normalize(options, keepSecure));
	}
},
{
	args: [
		"number",
		{ type: "string", optional: true },
		{ type: "boolean", optional: true }
	],
	call: function(port, host, secure)
	{
		var str = "port: " + port;
		if (host)
			str += ", host: " + host;
		if (secure != null)
			str += ", secure: " + secure;

		return str;
	}
},
{
	args: [
		"string",
		{ type: "boolean", optional: true }
	],
	call: function(path, secure)
	{
		var str = "path: " + path;
		if (secure != null)
			str += ", secure: " + secure;

		return str;
	}
});
