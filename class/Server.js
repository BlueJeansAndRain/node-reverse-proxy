"use strict";

var core = require('jscore');
var constants = require('./Constants.js');
var SNI = require('./SNI.js');
var HTTP = require('./HTTP.js');
var Proxy = require('./Proxy.js');

var Server = module.exports = core.Class.extend(function()
{
	core.sub.evented(this);

	this._servers = [];
	this._routes = [];
	this._proxies = [];
})
.implement({
	_clientIndex: 0,
	listen: core.fn.overload(
	{
		// TCP/IP
		args: [
			"number",
			{ type: "string", optional: true },
			{ type: "number", optional: true },
			{ type: "boolean", optional: true, _: false }
		],

		call: function(port, host, secure, backlog)
		{
			if (port < 1 || port > 65535 || port % 1 !== 0)
				throw new Error("Invalid port");

			var args = [port];
			if (!host)
				args.push(host);
			if (backlog != null)
				args.push(backlog);

			return this._listen(secure, args);
		}
	},
	{
		// Unix Socket Path OR Existing Socket
		args: [
			["string", "object"],
			{ type: "boolean", optional: true, _: false }
		],
		call: function(path, secure)
		{
			return this._listen(secure, [path]);
		}
	}),
	addRoute: core.fn.overload(
	{
		args: [
			["string", "regex"],
			{ type: "object" }
		],
		call: function(hostname, options)
		{
			this._routes.push({
				hostname: hostname,
				rx: typeof hostname === 'string' ? this._globToRegex(hostname) : hostname,
				options: core.util.combine({}, options, { keepHalfOpen: true })
			});

			return this;
		}
	}),
	removeRoute: core.fn.overload(
	{
		args: [
			["string", "regex"]
		],
		call: function(hostname)
		{
			var i = this._routes.length;

			while (i--)
			{
				if (this._routes[i].hostname === hostname)
				{
					this._routes.splice(i, 1);
					break;
				}
			}

			return this;
		}
	}),
	close: function()
	{
		var i = this._servers.length;
		while (i--)
			this._servers[i].close();

		return this;
	},
	_listen: function(secure, args)
	{
		var server = core.net.createServer({ allowHalfOpen: true });

		server
			.on('listening', this._onListening.bind(this, server))
			.on('connection', this._onConnection.bind(this, server))
			.on('close', this._onClose.bind(this, server))
			.on('error', this._onError.bind(this, server));

		server.secure = secure;
		server.listen.apply(server, args);

		this._servers.push(server);

		return this;
	},
	_globToRegex: function(glob)
	{
		return new RegExp(glob
			.replace(/[\^\-\[\]\s\\{}()+.,$|#]/g, "\\$&")
			.replace(/\*/g, '.*')
			.replace(/\?/g, '[^.:]*')
		);
	},
	_onListening: function(server)
	{
		this.emit('listening', server);
	},
	_onConnection: function(server, client)
	{
		client.index = this._clientIndex++;
		client.secure = !!server.secure;

		this._speculativeTimeout(client);

		client.once('data', this._onData.bind(this, server, client));

		this.emit('connection', client, server);
	},
	_onData: function(server, client, firstPacket)
	{
		var hostname = false;

		try
		{
			if (client.secure)
				hostname = SNI.parse(firstPacket);
			else
				hostname = HTTP.parse(firstPacket);
		}
		catch (err)
		{
			if (!(err instanceof SNI.NotPresent))
			{
				client.emit('warning', err.message ? err.message : err);
				client.destroy();

				return;
			}
		}

		this._proxy(server, client, firstPacket, hostname);
	},
	_onProxy: function(proxy)
	{
		this.emit('proxy', proxy);
	},
	_onClose: function(server)
	{
		this.emit('close', server);
	},
	_onError: function(server, err)
	{
		this.emit('error', err, server);
	},
	_speculativeTimeout: function(client)
	{
		// Some browsers make speculative connections which they never end up
		// using. This timeout will destroy these extra connections if they are
		// not used within one second.

		var timeout = setTimeout(function()
		{
			client
				.emit('warning', 'no data received')
				.destroy();
		}, 1000);

		client.once('data', function()
		{
			clearTimeout(timeout);
		});
	},
	_proxy: function(server, client, firstPacket, hostname)
	{
		var route = this._resolveRoute(hostname);

		if (!route)
		{
			if (client.secure)
				client.destroy();
			else
				client.end(constants.responseNoRoute, 'utf8');

			return;
		}

		var proxy = Proxy.create(server, client);

		proxy.upstream.on('error', function(err)
		{
			if (client.bytesWritten === 0 && !client.secure)
				proxy.client.end(constants.responseUpstreamError, 'utf8');
		});

		this._onProxy(proxy);

		proxy.connect(route, firstPacket);
	},
	_resolveRoute: function(hostname)
	{
		var i = this._routes.length;

		while (i--)
		{
			if (this._routes[i].rx.test(hostname))
				return this._routes[i].options;
		}

		return false;
	}
});

core.util.readonly(Server, { version: constants.package.version });
