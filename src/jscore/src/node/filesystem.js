"use strict";

var fs = require('fs');
var path = require('path');

function mkpathRecurse(parts, mode, callback)
{
	if (parts.length === 0)
	{
		callback();
		return;
	}

	var working = parts.pop();
	if (working === "")
	{
		mkpathRecurse(parts, mode, callback);
		return;
	}

	fs.exists(working, function(exists)
	{
		if (!exists)
		{
			fs.mkdir(working, function(err)
			{
				if (err)
				{
					callback(err);
				}
				else
				{
					fs.chmod(working, mode, function(err)
					{
						if (err)
							callback(err);
						else
							mkpathRecurse(parts, mode, callback);
					});
				}
			});
		}
		else
		{
			fs.stat(working, function(err, stats)
			{
				if (err)
					callback(err);
				else if (!stats.isDirectory())
					callback(new Error("Path contains a file."));
				else
					mkpathRecurse(parts, mode, callback);
			});
		}
	});
}

function mkpathRecurseSync(parts, mode)
{
	if (parts.length === 0)
		return;

	var working = parts.pop();
	if (working !== "")
	{
		var exists = fs.existsSync(working);
		if (!exists)
		{
			fs.mkdirSync(working);
			fs.chmodSync(working, mode);
		}
		else
		{
			var stats = fs.statSync(working);
			if (!stats.isDirectory())
				throw new Error("Path contains a file.");
		}
	}

	mkpathRecurseSync(parts, mode);
}

function mkpath(fullPath, mode, callback)
{
	if (callback == null)
	{
		if (mode != null)
			callback = mode;
		else
			callback = function() {};

		mode = parseInt(777, 8);
	}

	var parts = path.normalize(fullPath).split(path.sep),
		i = parts.length;

	while (i--)
		parts[i] = parts.slice(0, i + 1).join(path.sep);

	mkpathRecurse(parts.reverse(), mode, callback);
}

function mkpathSync(fullPath, mode)
{
	if (mode == null)
		mode = parseInt(777, 8);

	var parts = path.normalize(fullPath).split(path.sep),
		i = parts.length;

	while (i--)
		parts[i] = parts.slice(0, i + 1).join(path.sep);

	mkpathRecurseSync(parts.reverse(), mode);
}

exports.mkpath = mkpath;
exports.mkpathSync = mkpathSync;
