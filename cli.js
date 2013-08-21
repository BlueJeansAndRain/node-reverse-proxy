#!/usr/bin/env node
"use strict";

var proxima = require('./');
var core = require('jscore');
var fs = require('fs');
var path = require('path');
var constants = require('./src/Constants.js');

var argv = require('optimist')
	.usage(core.str.trim(constants.usage))
	.options( 'help', {
		'boolean': true,
		'description': 'Display this help text.'
	})
	.options( 'config', {
		'alias': 'c',
		'description': 'Set the configuration file path.',
		'default': './proxima.json'
	})
	.options( 'verbose', {
		'alias': 'v',
		'boolean': true,
		'description': 'Print log messages to stderr.'
	})
	.options( 'quiet', {
		'alias': 'q',
		'boolean': true,
		'description': 'Do not print log messages to stderr.'
	})
	.argv;

if (argv.help)
{
	require('optimist').showHelp();
	process.exit();
}

var options = {
	listeners: [],
	routes: [],
	uid: null,
	gid: null,
	verbose: !!argv.verbose
};

var configPath = path.resolve(argv.config);

try
{
	options = core.util.jsonConfig(configPath, options);
}
catch (err)
{
	console.error(err.message + ': ' + configPath);
	process.exit(1);
}

if (argv.quiet)
	options.verbose = false;

if (!(options.listeners instanceof Array) || options.listeners.length === 0)
{
	console.error("No listener addresses or paths.");
	process.exit(1);
}

function log(message)
{
	if (options.verbose && message != null)
		console.error(''+message);
}

log('Config: ' + configPath);

var server = proxima.Server.create()
	.on('connection', function(client)
	{
		log('Connection #' + client.index + ' from ' + proxima.endpoint.pretty(client.remotePort, client.remoteAddress));
		log(' to ' + proxima.endpoint.pretty(client.localPort, client.localAddress, client.secure));

		client
			.on('hostname', function(hostname)
			{
				log('Connection #' + this.index + ' hostname: ' + hostname);
			})
			.on('error', function(err)
			{
				log('Connection #' + this.index + ' ' + err);
			})
			.on('warning', function(message)
			{
				log('Connection #' + this.index + ' ' + message);
			})
			.on('close', function(/*has_error*/)
			{
				log('Connection #' + this.index + ' closed');
			});
	})
	.on('proxy', function(proxy, connectArgs)
	{
		log('Connection #' + proxy.client.index + (proxy.client.proxied ? ' re-proxy to ' : ' proxy to ') + proxima.endpoint.pretty(connectArgs));
		proxy.client.proxied = true;
	});

log('Routes:');
var noRoutes = true;

if (options.routes instanceof Array && options.routes.length > 0)
{
	void function(server, routes)
	{
		var i = 0,
			imax = routes.length,
			route, hostnames, j, jmax;

		try
		{
			for (; i < imax; ++i)
			{
				route = routes[i];

				if (!(route instanceof Object))
					throw new Error("invalid route");

				hostnames = route.hostname;
				if (!(hostnames instanceof Array))
					hostnames = [hostnames];

				for (j = 0, jmax = hostnames.length; j < jmax; ++j)
				{
					server.addRoute(hostnames[j], route.to);

					log(' from "' + hostnames[j] + '" to ' + proxima.endpoint.pretty(route.to, true));

					noRoutes = false;
				}
			}
		}
		catch (err)
		{
			console.error("Error: invalid route (" + i + ")");
			process.exit(1);
		}
	}
	(server, options.routes);
}

void function(server, options, errorCodes)
{
	var i = 0,
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

			server['set' + code](value);
			log(' error ' + code + ' to ' + (value ? proxima.endpoint.pretty(value) : 'disconnect'));

			noRoutes = false;
		}
	}
	catch (err)
	{
		console.error("Error: invalid " + errorCodes[i] + " value");
		process.exit(1);
	}
}
(server, options, ['404', '500', '504']);

if (noRoutes)
	log(' <none>');

log('Listeners:');

void function(server, listeners)
{
	var i = 0,
		max = listeners.length,
		args;

	try
	{
		for (; i < max; ++i)
		{
			args = proxima.endpoint.normalize(listeners[i], true);
			server.listen.apply(server, args);
			log(' ' + proxima.endpoint.pretty(args));
		}
	}
	catch (err)
	{
		console.error("Error: invalid listener (" + i + ")");
		process.exit(1);
	}
}
(server, options.listeners);

if (/number|string/.test(typeof options.uid))
{
	process.setuid(options.uid);
	log('UID: ' + options.uid);
}

if (/number|string/.test(typeof options.gid))
{
	process.setuid(options.gid);
	log('GID: ' + options.gid);
}

log('');
