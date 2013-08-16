"use strict";

var core = require('jscore');

exports.nodeVersion = process.version.substr(1);
exports.package = core.reflect.resourceSync('../package.json');
exports.serverHeader = 'node-reverse-proxy/' + exports.package.version + ' Node.js/' + exports.nodeVersion;
exports.template = core.reflect.resourceSync('../resources/template.html')
	.replace(/<!--%NODE_VERSION%-->/g, exports.nodeVersion)
	.replace(/<!--%SERVER%-->/g, exports.serverHeader)
	.replace(/<!--%NAME%-->/g, exports.package.name)
	.replace(/<!--%VERSION%-->/g, exports.package.version)
	.replace(/<!--%URL%-->/g, exports.package.repository.url)
	.replace(/<!--%AUTHOR%-->/g, exports.package.author);
