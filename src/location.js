"use strict";

var core = require('jscore');
var net = require('net');

exports.normalize = core.fn.overload(
{
	args: [
		["number", "string", "object"],
		{ type: "boolean", optional: true, _: false}
	],
	call: function(location, keepSecure)
	{
		if (typeof location === 'number')
			location = { port: location };
		else if (typeof location === 'string')
			location = { path: location };

		if (typeof location.port === 'number')
		{
			if (location.port % 1 !== 0)
				throw new Error("expecting integer");
			else if (location.port < 1 || location.port > 65535)
				throw new Error("port out of range");

			if (location.host != null)
			{
				if (!net.isIP(location.host))
					throw new Error("invalid host");

				if (keepSecure)
					return [location.port, location.host, !!location.secure];
				else
					return [location.port, location.host];
			}

			if (keepSecure)
				return [location.port, !!location.secure];
			else
				return [location.port];
		}

		if (typeof location.path !== 'string')
			throw new Error("expecting port or path");

		if (keepSecure)
			return [location.path, !!location.secure];
		else
			return [location.path];
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
