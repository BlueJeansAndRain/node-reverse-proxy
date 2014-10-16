"use strict";

var net = require('net');
var http = require('http');
var https = require('https');
var Class = require('../class.js');

var proto = {
	setDefaultTimeout: function(ms, cb)
	{
		if (typeof ms === 'undefined')
			ms = 0;
		else if (typeof ms === 'number' && ms >= 0)
			this._defaultTimeout = ms;

		if (cb)
			this.on('timeout', cb);

		return this;
	},
	getConnections: function()
	{
		return this._sockets.slice(0);
	},
	_init: function()
	{
		this._sockets = [];
		this.on('connection', this._onConnection.bind(this));

		var _close = this.close;
		this.close = function()
		{
			_close.apply(this, arguments);
			this._closeConnections();
		};
	},
	_onConnection: function(socket)
	{
		this._sockets.push(socket);

		if (this._defaultTimeout)
			socket.setTimeout(this._defaultTimeout);

		socket.on('timeout', this._onTimeout.bind(this, socket));
		socket.on('close', this._onClose.bind(this, socket));
	},
	_onTimeout: function(socket)
	{
		this.emit('timeout', socket);
	},
	_onClose: function(socket)
	{
		this._sockets.splice(this._sockets.indexOf(socket), 1);
	},
	/*_onCloseTimeout: function()
	{
		this.end();
	},*/
	_closeConnections: function()
	{
		var connections = this._sockets.slice(0),
			i = connections.length;

		while (i--)
		{
			/*connections[i].removeAllListeners('timeout');
			connections[i].setTimeout(100);
			connections[i].on('timeout', this._onCloseTimeout);*/

			connections[i].end();
			//connections[i].destroy();
		}
	}
};

var HTTPServer = Class(http.Server).extend(function HTTPServer()
{
	HTTPServer.parent.apply(this, arguments);
	this._init();
})
.implement(proto);

var HTTPSServer = Class(https.Server).extend(function HTTPSServer()
{
	HTTPSServer.parent.apply(this, arguments);
	this._init();
})
.implement(proto);

var Server = Class(net.Server).extend(function Server()
{
	Server.parent.apply(this, arguments);
	this._init();
})
.implement(proto);

exports.HTTPServer = HTTPServer;
exports.HTTPSServer = HTTPSServer;
exports.Server = Server;

exports.createHTTPServer = HTTPServer.create.bind(HTTPServer);
exports.createHTTPSServer = HTTPSServer.create.bind(HTTPSServer);
exports.createServer = Server.create.bind(Server);
