"use strict";

var Class; /// require class.js
var combine; /// require util.combine.js
/// target none
	Class = require('./class.js');
	combine = require('./util.combine.js');
/// target

var Def = Class.extend(function Def(_default)
{
	this._default = _default;
	this._type = typeof this._default;
	this._ctor = this._type === 'object' ? this._default.constructor : null;
})
.implement({
	check: function(value)
	{
		if (value == null)
			return false;

		if (typeof value !== this._type)
			return false;

		if (this._type === 'object')
		{
			if (this._default.constructor === Object)
				return value instanceof Object && !(value instanceof Array);
			else if (this._default.constructor === Array)
				return value instanceof Array;
			else
				return value instanceof this._default.constructor;
		}

		return true;
	},
	getDefault: function()
	{
		if (this._type === 'object')
		{
			if (this._default.constructor === Object)
				return combine({}, this._default);
			else if (this._default.constructor === Array)
				return this._default.slice(0);
		}

		return this._default;
	}
});

function varg()
{
	if (arguments.length < 1 || !(arguments[arguments.length - 1] instanceof Function))
		throw new Error("Expecting Function as last argument");

	var argDefs = Array.prototype.slice.call(arguments, 0),
		fn = argDefs.pop(),
		i = argDefs.length;

	while (i--)
	{
		if (argDefs[i] == null)
			argDefs[i] = null;
		else
			argDefs[i] = new Def(argDefs[i]);
	}

	return function()
	{
		var args = Array.prototype.slice.call(arguments, 0),
			i = 0,
			max = argDefs.length;

		for (; i < max; ++i)
		{
			if (argDefs[i] && !argDefs[i].check(args[i]))
				args.splice(i, 0, argDefs[i].getDefault());
		}

		return fn.apply(this, args);
	};
}

/// export varg
/// target none
	module.exports = varg;
/// target
