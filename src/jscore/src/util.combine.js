"use strict";

function combine(target)
{
	if (!(target instanceof Object))
		return target;

	var sources = Array.prototype.slice.call(arguments, 1),
		i = 0,
		imax = sources.length,
		j;

	for (; i < imax; ++i)
	{
		if (!(sources[i] instanceof Object))
			continue;

		for (j in sources[i])
		{
			if (sources[i][j] != null)
				target[j] = sources[i][j];
		}
	}

	return target;
}

/// export combine
/// target none
	module.exports = combine;
/// target
