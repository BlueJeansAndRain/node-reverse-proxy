"use strict";

var Class = require('../class.js');
var once = require('../function.once.js');
var sub = require('../subscriber.js');

function onSignal()
{
	if (exports.isShuttingDown())
	{
		process.exit(1);
	}
	else
	{
		console.error();
		exports.now();
		setTimeout(function()
		{
			console.error('(^C again to quit)');
		}, 100);
	}
}

var Shutdown = Class.extend(function Shutdown()
{
	this._timeout = false;
	this._keepAlive = false;
	this._cleanupPromise = new sub.Promise();
	this._cleanupCallbacks = [];
	this._code = 0;
})
.implement({
	now: function(code, callback)
	{
		this.timeout(0, code, callback);

		return this;
	},
	timeout: function(milliseconds, code, callback)
	{
		clearTimeout(this._timeout);

		this._code = code || this._code;

		if (callback)
			process.on('exit', callback);

		if (!this.isShuttingDown())
		{
			var self = this;
			this._timeout = setTimeout(function()
			{
				self._cleanupPromise.resolve();
			}, milliseconds);
		}

		return this;
	},
	cleanup: function(callback)
	{
		if (this._keepAlive === false)
		{
			// Prevent normal idle loop exiting when there are cleanup callbacks
			// registered.
			this._keepAlive = setInterval(function(){}, 1000);

			process.on('SIGINT', onSignal);
			//process.on('SIGTERM', onSignal);
			//process.on('SIGQUIT', onSignal);
		}

		this._addCleanup(callback);

		return this;
	},
	removeCleanup: function(callback)
	{
		this._removeCleanup(callback);

		if (this._cleanupCallbacks.length === 0)
		{
			clearInterval(this._keepAlive);
			this._keepAlive = false;

			process.off('SIGINT', onSignal);
			//process.off('SIGTERM', onSignal);
			//process.off('SIGQUIT', onSignal);
		}

		return this;
	},
	isShuttingDown: function()
	{
		return (this._cleanupPromise.getState() !== 'pending');
	},
	_clean: function(callback)
	{
		this._removeCleanup(callback);

		if (this._cleanupCallbacks.length === 0)
			process.exit(this._code);
	},
	_addCleanup: function(callback)
	{
		this._cleanupCallbacks.push(callback);
		this._cleanupPromise.done(callback.bind(this, once(this._clean).bind(this, callback)));
	},
	_removeCleanup: function(callback)
	{
		var i = this._cleanupCallbacks.length;
		while (i--)
		{
			if (this._cleanupCallbacks[i] === callback)
			{
				this._cleanupCallbacks.splice(i, 1);
				break;
			}
		}
	}
});

exports = module.exports = new Shutdown();
