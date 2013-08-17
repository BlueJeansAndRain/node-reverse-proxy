"use strict";

var core = require('jscore');

var Proxy = module.exports = core.Class.extend(function(server, connection, firstPacket)
{
	core.sub.evented(this);

	this._buffer = [firstPacket];
	this._proxySocket = null;
	this.defineProperty(server, 'server', { writable: false });
	this.defineProperty(connection, 'connection', { writeable: false });

	connection.pause();
})
.implement({
	connect: function(options)
	{

	}
});
