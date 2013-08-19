"use strict";

var core = require('jscore');
var resource = core.reflect.resourceSync;
var escapeHtml = core.str.escapeHtml;

exports.nodeVersion = process.version.substr(1);
exports.package = resource('../package.json');
exports.serverHeader = 'node-reverse-proxy/' + exports.package.version + ' Node.js/' + exports.nodeVersion;
exports.errorHeaders = resource('../resources/errorHeaders.txt')
	.replace(/<!--%SERVER%-->/g, exports.serverHeader) + "\n";
exports.errorBody = exports.errorHeaders + resource('../resources/errorBody.html')
	.replace(/<!--%NODE_VERSION%-->/g, exports.nodeVersion)
	.replace(/<!--%SERVER%-->/g, exports.serverHeader)
	.replace(/<!--%NAME%-->/g, escapeHtml(exports.package.name))
	.replace(/<!--%VERSION%-->/g, exports.package.version)
	.replace(/<!--%HOMEPAGE%-->/g, exports.package.homepage)
	.replace(/<!--%AUTHOR_NAME%-->/g, escapeHtml(exports.package.author.name))
	.replace(/<!--%AUTHOR_EMAIL%-->/g, escapeHtml(exports.package.author.email));
exports.responseNoRoute = exports.errorBody
	.replace(/<!--%CODE%-->/g, '404')
	.replace(/<!--%REASON%-->/g, 'Hostname Not Found');
exports.responseUpstreamInvalid = exports.errorBody
	.replace(/<!--%CODE%-->/g, '500')
	.replace(/<!--%REASON%-->/g, 'Invalid Upstream Configuration');
exports.responseUpstreamError = exports.errorBody
	.replace(/<!--%CODE%-->/g, '504')
	.replace(/<!--%REASON%-->/g, 'No Upstream Response');
