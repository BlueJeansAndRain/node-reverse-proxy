"use strict";

var core = require('jscore');
var net = require('net');
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
	_404: true,
	_500: true,
	_504: true,
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
		call: function(hostname, upstream)
		{
			this._routes.push({
				hostname: hostname,
				rx: typeof hostname === 'string' ? this._globToRegex(hostname) : hostname,
				upstream: core.util.combine({}, upstream, { allowHalfOpen: true })
			});

			return this;
		}
	}),
	set404: core.fn.overload(
	{
		args: [['boolean', "object", "function"]],
		call: function(value)
		{
			this._404 = value;
			return this;
		}
	}),
	set500: core.fn.overload(
	{
		args: [['boolean', "object", "function"]],
		call: function(value)
		{
			this._500 = value;
			return this;
		}
	}),
	set504: core.fn.overload(
	{
		args: [['boolean', "object", "function"]],
		call: function(value)
		{
			this._504 = value;
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
		var server = net.createServer({ allowHalfOpen: true });

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
		core.fn.safe( this, 'emit', 'listening', server);
	},
	_onConnection: function(server, client)
	{
		client.index = this._clientIndex++;
		client.secure = !!server.secure;

		this._speculativeTimeout(client);

		client.once('data', this._onData.bind(this, server, client));

		core.fn.safe( this, 'emit', 'connection', client, server);
	},
	_onData: function(server, client, firstPacket)
	{
		var hostname = '';

		try
		{
			if (client.secure)
				hostname = SNI.parse(firstPacket);
			else
				hostname = HTTP.parse(firstPacket);
		}
		catch (err)
		{
			if (!(err instanceof SNI.NotPresent) && !(err instanceof HTTP.MissingHostHeader))
			{
				core.fn.safe(client, 'emit', 'warning', err.message ? err.message : err);
				client.destroy();

				return;
			}
		}

		var upstream = this._resolveRoute(hostname);

		if (!upstream)
		{
			if (client.secure)
				client.destroy();
			else
				this._on404(server, client, firstPacket);
		}
		else
		{
			this._proxy(server, client, firstPacket, upstream);
		}
	},
	_onProxy: function(proxy)
	{
		core.fn.safe( this, 'emit', 'proxy', proxy);
	},
	_onClose: function(server)
	{
		core.fn.safe( this, 'emit', 'close', server);
	},
	_onError: function(server, err)
	{
		core.fn.safe( this, 'emit', 'error', err, server);
	},
	_speculativeTimeout: function(client)
	{
		// Some browsers make speculative connections which they never end up
		// using. This timeout will destroy these extra connections if they are
		// not used within one second.

		var timeout = setTimeout(function()
		{
			core.fn.safe(client, 'emit', 'warning', 'no data received');
			client.destroy();
		}, 1000);

		client.once('data', function()
		{
			clearTimeout(timeout);
		});
	},
	_proxy: function(server, client, firstPacket, upstream, silent)
	{
		var proxy = Proxy.create(server, client);

		this._proxies.push(proxy);

		proxy
			.on('close', function()
			{
				var i = this._proxies.length;
				while (i--)
				{
					if (this._proxies[i] === proxy)
					{
						this._proxies.splice(i, 1);
						break;
					}
				}
			}.bind(this))
			.on('error', function()
			{
				if (!client.secure && !silent)
					this._on504(server, client, firstPacket);
			}.bind(this));

		this._onProxy(proxy);

		try
		{
			proxy.connect(upstream, firstPacket);
		}
		catch (err)
		{
			if (client.secure)
				client.destroy();
			else if (!silent)
				this._on500(server, client, firstPacket);

			this._onError(null, err);
		}
	},
	_resolveRoute: function(hostname)
	{
		var i = this._routes.length;

		while (i--)
		{
			if (this._routes[i].rx.test(hostname))
				return this._routes[i].upstream;
		}

		return false;
	},
	_on404: function(server, client, firstPacket)
	{
		if (this._404 === false)
			return;
		else if (this._404 === true)
			client.end(constants.responseNoRoute, 'utf8');
		else if (this._404 instanceof Function)
			this._404(server, client, firstPacket);
		else
			this._proxy(server, client, firstPacket, this._404, true);
	},
	_on500: function(server, client, firstPacket)
	{
		if (this._500 === false)
			return;
		else if (this._500 === true)
			client.end(constants.responseUpstreamInvalid, 'utf8');
		else if (this._500 instanceof Function)
			this._500(server, client, firstPacket);
		else
			this._proxy(server, client, firstPacket, this._500, true);
	},
	_on504: function(server, client, firstPacket)
	{
		if (this._504 === false)
			return;
		else if (this._504 === true)
			client.end(constants.responseUpstreamError, 'utf8');
		else if (this._504 instanceof Function)
			this._504(server, client, firstPacket);
		else
			this._proxy(server, client, firstPacket, this._504, true);
	}
});

core.util.readonly(Server, { version: constants.package.version });
