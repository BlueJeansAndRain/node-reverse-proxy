"use strict";

var proxima = require('../');

exports.eachRoute = function(routes, callback)
{
	var i = 0,
		imax = routes.length,
		route, hostnames, hostname, j, jmax;

	try
	{
		for (; i < imax; ++i)
		{
			route = routes[i];

			if (!(route instanceof Object))
				throw new Error("route not an object");

			hostnames = route.hostname;
			if (!(hostnames instanceof Array))
				hostnames = [hostnames];

			for (j = 0, jmax = hostnames.length; j < jmax; ++j)
			{
				hostname = hostnames[j];
				if (typeof hostname === 'string')
					hostname = { type: 'string', value: hostname };
				else if (hostname instanceof RegExp)
					hostname = { type: 'regex', value: hostname.toString() };
				else
					throw new Error("expecting regular expression or string hostname");

				callback(
					hostname,
					route.to
				);
			}
		}
	}
	catch (err)
	{
		throw new Error("invalid route (" + i + "): " + err.message);
	}
};

exports.eachError = function(options, callback)
{
	var errorCodes = ['404', '500', '504'],
		i = 0,
		max = errorCodes.length,
		code, value;

	try
	{
		for (; i < max; ++i)
		{
			code = errorCodes[i];
			value = options[errorCodes[i]];

			if (value == null)
				continue;

			callback(code, value);
		}
	}
	catch (err)
	{
		throw new Error("invalid " + errorCodes[i] + " error value: " + err.message);
	}
};

exports.eachListener = function(listeners, callback)
{
	var i = 0,
		max = listeners.length,
		args;

	try
	{
		for (; i < max; ++i)
			callback(proxima.endpoint.normalize(listeners[i], true));
	}
	catch (err)
	{
		throw new Error("invalid listener (" + i + "): " + err.message);
	}
};
