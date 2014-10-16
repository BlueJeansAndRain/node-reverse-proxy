"use strict";

var overload; /// require function.overload.js
/// target none
	overload = require('./function.overload.js');
/// target

var safe = overload(
{
	args: "function",
	extraArgs: 'array',
	call: function (fn, args)
	{
		try
		{
			return fn.apply(this, args);
		}
		catch (err)
		{
			return false;
		}
	}
},
{
	args: [
		"anyobject",
		"string"
	],
	extraArgs: 'array',
	call: function (obj, prop, args)
	{
		try
		{
			return obj[prop].apply(obj, args);
		}
		catch (err)
		{
			return false;
		}
	}
},
{
	args: [
		"anyobject",
		"function"
	],
	extraArgs: 'array',
	call: function (obj, fn, args)
	{
		try
		{
			return fn.apply(obj, args);
		}
		catch (err)
		{
			return false;
		}
	}
});

/// export safe
/// target none
	module.exports = safe;
/// target
