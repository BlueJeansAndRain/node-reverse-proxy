"use strict";

var Class; /// require class.js
var promised; /// require subscriber.promised.js
/// target none
	Class = require('./class.js');
	promised = require('./subscriber.promised.js');
/// target

var Promise = (function()
{
	function childrenComplete()
	{
		/* jshint validthis: true */
		var i = this.children.length,
			resolved = [],
			rejected = [];

		while (i--)
		{
			switch (this.children[i].getState())
			{
				case 'resolved':
					resolved.push(this.children[i]);
					break;
				case 'rejected':
					rejected.push(this.children[i]);
					break;
				default:
					return;
			}
		}

		this.self.resolve(resolved, rejected);
	}

	return Class.extend(function Promise()
	{
		promised(this);

		if (arguments.length > 0)
		{
			var context = {
				self: this
			};

			if (arguments[0] instanceof Array)
				context.children = arguments[0].slice();
			else
				context.children = Array.prototype.slice.call(arguments);

			var complete = childrenComplete.bind(context);

			if (context.children.length > 0)
			{
				var i = context.children.length;
				while (i--)
				{
					if (context.children[i].getState() === 'pending')
						context.children[i].done(complete).fail(complete);
				}
			}

			complete();
		}
	})
	.implementStatic({
		build: function(collection, callback)
		{
			var promises = [],
				child, i;

			if (collection instanceof Array)
			{
				i = 0;
				var max = collection.length;

				for (; i < max; ++i)
				{
					child = promises({
						item: collection[i],
						index: i
					});

					if (callback.call(collection[i], child) !== false)
						promises.push(child);
				}
			}
			else
			{
				for (i in collection)
				{
					child = promises({
						item: collection[i],
						index: i
					});

					if (callback.call(collection[i], child) !== false)
						promises.push(child);
				}
			}

			return Promise.create(promises);
		}
	});
}());

/// export Promise
/// target none
	module.exports = Promise;
/// target
