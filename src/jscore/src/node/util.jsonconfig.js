"use strict";

var fs = require('fs');
var overload = require('../function.overload.js');
var safe = require('../function.safe.js');
var combine = require('../util.combine.js');

module.exports = overload(
{
	args: [
		"string",
		{ type: "object", optional: true }
	],
	call: function(path, defaults)
	{
		var stats = safe(fs.statSync, path);
		if (!stats)
			throw new Error('Configuration file not found');
		else if (!stats.isFile())
			throw new Error('Invalid configuration file');

		var config = safe(fs.readFileSync, path, { encoding: 'utf8' });
		if (config === false)
			throw new Error('Cannot read configuration file');

		config = safe(JSON.parse, config);
		if (!(config instanceof Object))
			throw new Error('Expecting JSON object in configuration file');

		return combine({}, defaults, config);
	}
});
