"use strict";

var core = require('./jscore');

var HTTP = module.exports = {

	MissingHostHeader: core.Exception.extend(function MissingHostHeader() {
		MissingHostHeader.parent.call(this, "HTTP host header missing");
	}),

	parse: function(firstPacket)
	{
		var hostname = firstPacket
			// Convert the packet to text.
			.toString('utf8')
			// Strip everything after the first double newline so that the body
			// doesn't get parsed for headers.
			.replace(/\n\n[\s\S]*$/, '')
			// Find a line that looks like a Host header.
			.match(/^host:\s*([^\s\:]+)(?:\:\d+)?$/im);

		if (hostname)
			return hostname[1];

		throw HTTP.MissingHostHeader.create();
	}

};
