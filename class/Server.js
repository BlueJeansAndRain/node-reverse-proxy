"use strict";

var core = require('jscore');
var constants = require('./Constants.js');

var Server = module.exports = core.Class.extend(function()
{
	core.sub.evented(this);

	this._servers = [];
	this._routes = [];
})
.implementStatic({
	version: constants.package.version
})
.implement({
	listen: core.fn.overload(
	{
		// TCP/IP
		args: [
			"number",
			{ type: "string", optional: true, _: '' },
			{ type: "number", optional: true, _: -1 },
			{ type: "function", optional: true, _: function() {} }
		],

		call: function(port, host, backlog, callback)
		{

		}
	},
	{
		// Unix
		args: [
			"string",
			{ type: "function", optional: true, _: function() {} }
		],
		call: function(path, callback)
		{

		}
	},
	{
		// Existing
		args: [
			"object",
			{ type: "function", optional: true, _: function() {} }
		],
		call: function(handle, callback)
		{

		}
	}),
	close: function(callback)
	{

	}
});
