#!/usr/bin/env node
"use strict";

var proxy = require('./');
var core = require('jscore');
var fs = require('fs');
var path = require('path');
var constants = require('./src/Constants.js');
var location = require('./src/location.js');

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

var server = proxy.Server.create()
	.on('connection', function(connection)
	{
		log('Connection #' + connection.index + ' from ' + location.pretty(connection.remotePort, connection.remoteAddress));
		log(' to ' + location.pretty(connection.localPort, connection.localAddress, connection.secure));

		connection
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
	.on('proxy', function(proxy)
	{
		log('Connection #' + proxy.client.index + ' proxied');
	});

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
			args = location.normalize(listeners[i], true);
			server.listen.apply(server, args);
			log(' ' + location.pretty(args));
		}
	}
	catch (err)
	{
		log("Error: invalid listener (" + i + ")");
		process.exit(1);
	}
}
(server, options.listeners);

log('Routes:');

if (options.routes instanceof Array && options.routes.length > 0)
{
	void function(server, routes)
	{
		var i = 0,
			max = routes.length;

		try
		{
			for (; i < max; ++i)
			{
				if (!(routes[i] instanceof Object))
					throw new Error("invalid route");

				server.addRoute(routes[i].hostname, routes[i].to);

				log(' from "' + routes[i].hostname + '"');
				log('   to ' + location.pretty(routes[i].to, true));
			}
		}
		catch (err)
		{
			log("Error: invalid route (" + i + ")");
			process.exit(1);
		}
	}
	(server, options.routes);
}
else
{
	log(' <none>');
}

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
