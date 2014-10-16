"use strict";

var overload; /// require function.overload.js
/// target none
	overload = require('./function.overload.js');
/// target

var readonly = overload(
{
	args: "anyobject",
	extraArgs: 'array',
	call: function(object, sources)
	{
		var i = 0,
			imax = sources.length,
			j;

		for (; i < imax; ++i)
		{
			if (!(sources[i] instanceof Object))
				continue;

			for (j in sources[i])
			{
				if (sources[i][j] == null)
					continue;

				Object.defineProperty(object, j, {
					value: sources[i][j],
					enumerable: true,
					writable: false
				});
			}
		}

		return object;
	}
});

/// export readonly
/// target none
	module.exports = readonly;
/// target
