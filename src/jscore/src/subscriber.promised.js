"use strict";

var promised = (function()
{
	function done(callback)
	{
		/* jshint validthis: true */
		if (this.result)
		{
			if (this.state === 'resolved')
				callback.apply(this.self, this.result);
		}
		else
		{
			this.onResolved.push(callback);
		}

		return this.self;
	}

	function fail(callback)
	{
		/* jshint validthis: true */
		if (this.result)
		{
			if (this.state === 'rejected')
				callback.apply(this.self, this.result);
		}
		else
		{
			this.onRejected.push(callback);
		}

		return this.self;
	}

	function resolve()
	{
		/* jshint validthis: true */
		if (this.result)
			throw new Error("Promise state is not pending.");

		this.result = Array.prototype.slice.call(arguments);
		this.state = 'resolved';

		var i = 0,
			max = this.onResolved.length;

		for (; i < max; ++i)
			this.onResolved[i].apply(this.self, this.result);

		delete this.onResolved;
		delete this.onRejected;
	}

	function reject()
	{
		/* jshint validthis: true */
		if (this.result)
			throw new Error("Promise state is not pending.");

		this.result = Array.prototype.slice.call(arguments);
		this.state = 'rejected';

		var i = 0,
			max = this.onRejected.length;

		for (; i < max; ++i)
			this.onRejected[i].apply(this.self, this.result);

		delete this.onResolved;
		delete this.onRejected;
	}

	function getState()
	{
		/* jshint validthis: true */
		return this.state;
	}

	function getResult()
	{
		/* jshint validthis: true */
		if (this.result)
			return this.result.slice();
		else
			return false;
	}

	return function promised(target)
	{
		var context = {
			self: target,
			onResolved: [],
			onRejected: [],
			state: 'pending',
			result: false
		};

		target.done = done.bind(context);
		target.fail = fail.bind(context);
		target.resolve = resolve.bind(context);
		target.reject = reject.bind(context);
		target.getState = getState.bind(context);
		target.getResult = getResult.bind(context);

		return target;
	};
}());

/// export promised
/// target none
	module.exports = promised;
/// target
