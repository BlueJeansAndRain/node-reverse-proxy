"use strict";

var core = require('jscore');
var net = require('net');
var endpoint = require('./endpoint.js');

module.exports = core.Class.extend(function(server, client)
{
	core.sub.evented(this);

	Object.defineProperty(this, 'server', { value: server, enumerable: true, writable: false });
	Object.defineProperty(this, 'client', { value: client, enumerable: true, writable: false });
	Object.defineProperty(this, 'upstream', { value: new net.Socket({ allowHalfOpen: false }), enumerable: true, writable: false });

	this.client.pause();
})
.implement({
	_clean: true,
	connect: core.fn.overload(
	{
		args: [
			"object",
			{ type: { is: "class", type: Buffer } }
		],
		call: function(options, firstPacket)
		{
			this._connect(firstPacket, options);

			return this;
		}
	},
	{
		args: [
			"number",
			{ type: "string", optional: true },
			{ type: { is: "class", type: Buffer } }
		],
		call: function(port, host, firstPacket)
		{
			this._connect(firstPacket, {
				port: port,
				host: host
			});

			return this;
		}
	},
	{
		args: [
			"string",
			{ type: { is: "class", type: Buffer } }
		],
		call: function(path, firstPacket)
		{
			this._connect(firstPacket, {
				path: path
			});

			return this;
		}
	}),
	close: core.fn.overload(
	{
		args: { type: "function", optional: true },
		call: function(onClose)
		{
			if (onClose)
				this.on('close', onClose);

			this._onUpstreamEnd();

			return this;
		}
	}),
	_connect: function(firstPacket, options)
	{
		var unpiped = false;

		this.upstream
			.on('connect', function()
			{
				this.upstream.write(firstPacket);
				this.client.resume();

				core.fn.safe(this, 'emit', 'connect');
			}.bind(this))
			.on('error', function(err)
			{
				if (this.client.bytesWritten !== 0)
					return;

				this.client.unpipe(this.upstream).unpipe(this.client);
				unpiped = true;

				core.fn.safe(this, 'emit', 'error', err);
			}.bind(this))
			.on('close', function()
			{
				if (!unpiped)
					this.client.destroy();

				core.fn.safe(this, 'emit', 'close');
			}.bind(this));

		this.client
			.pipe(this.upstream).pipe(this.client)
			.on('close', function()
			{
				if (!unpiped)
					this.upstream.destroy();
			}.bind(this));

		this.upstream.connect.apply(this.upstream, endpoint.normalize(options));
	}
});
