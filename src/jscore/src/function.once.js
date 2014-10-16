"use strict";

function once(fn)
{
	var called = false,
		failed = false,
		retval, err;

	return function once_wrapped()
	{
		if (!called)
		{
			called = true;
			try
			{
				retval = fn.apply(this, arguments);
			}
			catch (e)
			{
				failed = true;
				err = e;
			}
		}

		if (failed)
			throw err;
		else
			return retval;
	};
}

/// export once
/// target none
	module.exports = once;
/// target
