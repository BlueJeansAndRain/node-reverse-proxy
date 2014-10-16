"use strict";

exports.integer = function(value, min, max)
{
	value = parseInt(value, 10) || 0;
	if (typeof min === 'number' && value < min)
		value = min;
	else if (typeof max === 'number' && value > max)
		value = max;

	return value;
};
