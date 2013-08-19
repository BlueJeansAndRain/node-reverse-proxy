"use strict";

var core = require('jscore');
var net = require('net');
var constants = require('./Constants.js');

var Proxy = module.exports = core.Class.extend(function(server, client)
{
	core.sub.evented(this);

	Object.defineProperty(this, 'server', { value: server, enumerable: true, writable: false });
	Object.defineProperty(this, 'client', { value: client, enumerable: true, writable: false });
	Object.defineProperty(this, 'upstream', { value: new net.Socket({ allowHalfOpen: false }), enumerable: true, writable: false });

	core.fn.bindAll(this,
		'_onUpstreamError',
		'_onUpstreamConnect',
		'_onUpstreamData',
		'_onUpstreamEnd',
		'_onUpstreamClose',
		'_onClientData',
		'_onClientEnd',
		'_onClientClose'
	);

	this.client.pause();
})
.implement({
	_clean: true,
	connect: core.fn.overload(
	{
		args: [
			"object",
			{ type: { is: "class", type: Buffer } },
			{ type: "function", optional: true }
		],
		call: function(options, firstPacket, onConnect)
		{
			if (onConnect)
				this.on('connect', onConnect);

			this._connectUpstream(options);

			var self = this;

			this.upstream
				.once('error', this._onUpstreamError)
				.on('connect', this._onUpstreamConnect)
				.on('connect', function()
				{
					this.write(firstPacket);
					this.removeListener('error', self._onUpstreamError);
				})
				.on('data', this._onUpstreamData)
				.on('end', this._onUpstreamEnd)
				.on('close', this._onUpstreamClose);

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
	_connectUpstream: function(options)
	{
		if (typeof options.port === 'number')
			this.upstream.connect.apply(this.upstream, core.util.denull([options.port, options.host]));
		else if (typeof options.path === 'string')
			this.upstream.connect.apply(this.upstream, [options.path]);
		else
			throw new Error("expecting port or path");
	},
	_onUpstreamError: function(err)
	{
		this.upstream
			.removeListener('end', this._onUpstreamEnd)
			.removeListener('close', this._onUpstreamClose);

		core.fn.safe(this, 'emit', 'error', err);
	},
	_onUpstreamConnect: function()
	{
		this.client
			.on('data', this._onClientData)
			.on('end', this._onClientEnd)
			.on('close', this._onClientClose)
			.resume();

		core.fn.safe(this, 'emit', 'connect');
	},
	_onUpstreamData: function(data)
	{
		this.client.write(data);
	},
	_onUpstreamEnd: function()
	{
		this.upstream.removeListener('data', this._onUpstreamData);
		this.client.end();
	},
	_onUpstreamClose: function()
	{
		this.client.destroy();
	},
	_onClientData: function(data)
	{
		this.upstream.write(data);
	},
	_onClientEnd: function()
	{
		this.upstream.end();
	},
	_onClientClose: function()
	{
		this.upstream.destroy();
		core.fn.safe(this, 'emit', 'close');
	}
});
