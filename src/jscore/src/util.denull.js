"use strict";

var overload; /// require function.overload.js
/// target none
	overload = require('./function.overload.js');
/// target

var denull = overload(
{
	args: "array",
	call: function(array)
	{
		var i = array.length;
		while (i--)
		{
			if (array[i] == null)
				array.splice(i, 1);
		}

		return array;
	}
},
{
	args: "anyobject",
	call: function(object)
	{
		var i;
		for (i in object)
		{
			if (object[i] == null)
				delete object[i];
		}

		return object;
	}
});

/// export denull
/// target none
	module.exports = denull;
/// target
