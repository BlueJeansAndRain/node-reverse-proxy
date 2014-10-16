"use strict";

var core = require('./jscore');
var resource = core.reflect.resourceSync;
var escapeHtml = core.str.escapeHtml;

exports.nodeVersion = process.version.substr(1);
exports.package = resource('../package.json');
exports.serverHeader = exports.package.realName + '/' + exports.package.version + ' Node.js/' + exports.nodeVersion;
exports.errorHeaders = resource('../resources/errorHeaders.txt')
	.replace(/\r\n|\r|\n/, "\r\n")
	.replace(/<!--%SERVER%-->/g, exports.serverHeader) + "\r\n\r\n";
exports.errorBody = exports.errorHeaders + resource('../resources/errorBody.html')
	.replace(/<!--%NODE_VERSION%-->/g, exports.nodeVersion)
	.replace(/<!--%SERVER%-->/g, exports.serverHeader)
	.replace(/<!--%NAME%-->/g, escapeHtml(exports.package.realName))
	.replace(/<!--%VERSION%-->/g, exports.package.version)
	.replace(/<!--%HOMEPAGE%-->/g, exports.package.homepage)
	.replace(/<!--%AUTHOR_NAME%-->/g, escapeHtml(exports.package.author.name))
	.replace(/<!--%AUTHOR_EMAIL%-->/g, escapeHtml(exports.package.author.email))
	.replace(/^\s+/, '');
exports.responseNoRoute = exports.errorBody
	.replace(/<!--%CODE%-->/g, '404')
	.replace(/<!--%REASON%-->/g, 'Hostname Not Found');
exports.responseUpstreamInvalid = exports.errorBody
	.replace(/<!--%CODE%-->/g, '500')
	.replace(/<!--%REASON%-->/g, 'Invalid Upstream Configuration');
exports.responseUpstreamError = exports.errorBody
	.replace(/<!--%CODE%-->/g, '504')
	.replace(/<!--%REASON%-->/g, 'No Upstream Response');
exports.usage = resource('../resources/usage.txt')
	.replace(/%VERSION%/g, exports.package.version)
	.replace(/%DESCRIPTION%/g, exports.package.description);
