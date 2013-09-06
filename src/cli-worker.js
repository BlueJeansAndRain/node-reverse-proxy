"use strict";

exports.init = function(options, log)
{
	var proxima = require('../');

	var server = proxima.Server.create({
		specTimeout: options.specTimeout
	})
		.on('connection', function(client)
		{
			log(client.index + ' connect ' + proxima.endpoint.pretty(false, client.remotePort, client.remoteAddress) + ' -> ' + proxima.endpoint.pretty(client.localPort, client.localAddress, client.secure));

			client
				.on('hostname', function(hostname)
				{
					log(this.index + '  hostname: ' + hostname);
				})
				.on('error', function(err)
				{
					log(this.index + '  ' + err);
				})
				.on('warning', function(message)
				{
					log(this.index + '  ' + message);
				})
				.on('close', function(/*has_error*/)
				{
					log(this.index + '  closed');
				});
		})
		.on('proxy', function(proxy, connectArgs)
		{
			log(proxy.client.index + '  ' + (proxy.client.proxied ? 're-proxy' : 'proxy') + ' ' + proxima.endpoint.pretty(false, connectArgs));
			proxy.client.proxied = true;
		});

	var i, max, hostname;

	for (i = 0, max = options.routes.length; i < max; ++i)
	{
		hostname = options.routes[i].hostname;

		if (hostname.is === 'regex')
		{
			hostname = hostname.value.match(/^\/(.+)\/([a-z]*)$/);
			hostname = new RegExp(hostname[1], hostname[2]);
		}
		else
			hostname = hostname.value;

		server.addRoute(hostname, options.routes[i].to);
	}

	for (i = 0, max = options.errors.length; i < max; ++i)
		server['set' + options.errors[i].code](options.errors[i].value);

	for (i = 0, max = options.listeners.length; i < max; ++i)
		server.listen.apply(server, options.listeners[i]);

	if (options.uid)
		process.setuid(options.uid);

	if (options.gid)
		process.setuid(options.gid);
};
