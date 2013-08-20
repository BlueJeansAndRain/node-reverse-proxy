#!/usr/bin/env node
"use strict";

var proxy = require('./');
var core = require('jscore');
var fs = require('fs');
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
		'description': 'Set the configuration file path.'
	})
	.options( 'verbose', {
		'alias': 'v',
		'boolean': true,
		'description': 'Print log messages to stderr.'
	})
	.argv;

if (argv.help)
{
	require('optimist').showHelp();
	process.exit();
}

var options = {
	verbose: !!argv.verbose,
	listeners: [
		8080
	],
	routes: [],
	uid: null,
	gid: null
};

if (argv.config)
	options = core.util.combine(options, JSON.parse(fs.readFileSync(argv.config, { encoding: 'utf8' })));

if (!(options.listeners instanceof Array) || options.listeners.length === 0)
{
	console.error("No listener addresses or paths.");
	process.exit(1);
}

/*void function(listeners)
{
	var i = listeners.length;
	while (i--)
	{
		if (typeof listeners[i] === 'number')
			listeners[i] = { port: listeners[i] };
		else if (typeof listeners[i] === 'string')
			listeners[i] = { path: listeners[i] };
		else if (!(listeners[i] instanceof Object) || (typeof listeners[i].port !== 'number' && typeof listeners[i].path !== 'string'))
		{
			console.error("Invalid listener address or path.");
			process.exit(1);
		}
	}
}
(options.listeners);*/

function log(message)
{
	if (options.verbose && message != null)
		console.error(''+message);
}

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
	try
	{
		var i = 0,
			max = listeners.length,
			args;

		for (; i < max; ++i)
		{
			args = location.normalize(listeners[i], true);
			server.listen.apply(server, args);
			log(' ' + location.pretty(args));
		}
	}
	catch (err)
	{
		console.error(err.message);
		process.exit(1);
	}
}
(server, options.listeners);

log('Routes:');

if (options.routes instanceof Array && options.routes.length > 0)
{
	void function(server, routes)
	{
		try
		{
			var i = 0,
				max = routes.length;

			for (; i < max; ++i)
			{
				if (!(routes[i] instanceof Object))
					throw new Error("invalid route");

				server.addRoute(routes[i].hostname, location.normalize(routes[i].to));
			}
		}
		catch (err)
		{
			console.error(err.message);
			process.exit(1);
		}
	}
	(server, options.routes);
}
else
{
	log(' <none>');
}

log('');
