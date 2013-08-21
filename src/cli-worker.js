"use strict";

exports.init = function(routes, errors, listeners, uid, gid, log)
{
	var proxima = require('../');

	var server = proxima.Server.create()
		.on('connection', function(client)
		{
			log(client.index + ' connect ' + proxima.endpoint.pretty(client.remotePort, client.remoteAddress) + ' -> ' + proxima.endpoint.pretty(client.localPort, client.localAddress, client.secure));

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
			log(proxy.client.index + '  ' + (proxy.client.proxied ? 're-proxy' : 'proxy') + ' ' + proxima.endpoint.pretty(connectArgs));
			proxy.client.proxied = true;
		});

	var i, max, hostname;

	for (i = 0, max = routes.length; i < max; ++i)
	{
		hostname = routes[i].hostname;

		if (hostname.is === 'regex')
			hostname = new RegExp(hostname.value);
		else
			hostname = hostname.value;

		server.addRoute(hostname, routes[i].to);
	}

	for (i = 0, max = errors.length; i < max; ++i)
		server['set' + errors[i].code](errors[i].value);

	for (i = 0, max = listeners.length; i < max; ++i)
		server.listen.apply(server, listeners[i]);

	if (uid)
		process.setuid(uid);

	if (gid)
		process.setuid(gid);
};
