"use strict";

function prefix(fn)
{
	var prefixArgs = Array.prototype.slice.call(arguments, 1);

	return function()
	{
		var args = prefixArgs.concat(Array.prototype.slice.call(arguments, 0));
		return fn.apply(this, args);
	};
}

/// export prefix
/// target none
	module.exports = prefix;
/// target
