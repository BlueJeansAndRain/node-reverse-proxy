"use strict";

var overload; /// require function.overload.js
/// target none
	overload = require('./function.overload.js');
/// target

var bindAll = overload({
	args: "anyobject",
	extraArgs: "array",
	call: function(obj, names)
	{
		var i = names.length;

		while (i--)
		{
			if (typeof names[i] !== 'string')
				throw new Error("expecting method name");

			if (!(obj[names[i]] instanceof Object) || !(obj[names[i]].bind instanceof Function))
				throw new Error("expecting bindable property");

			obj[names[i]] = obj[names[i]].bind(obj);
		}
	}
});

/// export bindAll
/// target none
	module.exports = bindAll;
/// target
