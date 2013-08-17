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
})
.implement({
	_connectionIndex: 0,
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
	virtualHost: core.fn.overload(
	{
		args: [
			["string", "regex"],
			{ type: "object" }
		],
		call: function(hostname, options)
		{
			options = core.util.combine({}, options);
			options.keepHalfOpen = true;

			this._routes.push({
				test: this._makeHostnameTest(hostname),
				options: options
			});
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
		server.on('listening', this._onListening.bind(this, server));
		server.on('connection', this._onConnection.bind(this, server));
		server.on('close', this._onClose.bind(this, server));
		server.on('error', this._onError.bind(this, server));
		server.secure = secure;
		server.listen.apply(server, args);

		this._servers.push(server);

		return this;
	},
	_makeHostnameTest: function(hostname)
	{
		// TODO: Make a test function for matching connecting hostnames to the given hostname.
	},
	_onListening: function(server)
	{
		this.emit('listening', server);
	},
	_onConnection: function(server, connection)
	{
		connection.index = this._connectionIndex++;
		connection.secure = !!server.secure;

		this._speculativeTimeout(connection);

		connection.once('data', this._onData.bind(this, server, connection));

		this.emit('connection', connection, server);
	},
	_onData: function(server, connection, firstPacket)
	{
		var hostname = false;

		try
		{
			if (connection.secure)
				hostname = SNI.parse(firstPacket);
			else
				hostname = HTTP.parse(firstPacket);
		}
		catch (err)
		{
			if (!(err instanceof SNI.NotPresent))
			{
				connection.emit('warning', err.message ? err.message : err);
				connection.destroy();

				return;
			}
		}

		this._proxy(server, connection, firstPacket, hostname);
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
	_speculativeTimeout: function(connection)
	{
		// Some browsers make speculative connections which they never end up
		// using. This timeout will destroy these extra connections if they are
		// not used within one second.

		var timeout = setTimeout(function()
		{
			connection.emit('warning', 'no data received');
			connection.destroy();
		}, 1000);

		connection.once('data', function()
		{
			clearTimeout(timeout);
		});
	},
	_proxy: function(server, connection, firstPacket, hostname)
	{
		var route = this._resolveRoute(hostname);

		if (!route)
		{
			if (connection.secure)
			{
				connection.destroy();
			}
			else
			{
				// TODO: Send 404 page for unmatched non-secure routes.
				connection.end();
			}

			return;
		}

		var proxy = new Proxy(server, connection, firstPacket);

		this._onProxy(proxy);

		proxy.connect(route);
	},
	_resolveRoute: function(hostname)
	{
		// TODO: Match a virtual host and return the route connection options.
	}
});

Server.defineProperty(constants.package.version, 'version', { writable: false });
