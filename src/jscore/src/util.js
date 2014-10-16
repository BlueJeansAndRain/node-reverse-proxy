"use strict";

var combine; /// require util.combine.js
var denull; /// require util.denull.js
var readonly; /// require util.readonly.js

/// export combine as combine
/// export denull as denull
/// export readonly as readonly
/// target none
	combine = require('./util.combine.js');
	denull = require('./util.denull.js');
	readonly = require('./util.readonly.js');
	exports.combine = combine;
	exports.denull = denull;
	exports.readonly = readonly;
	exports.jsonConfig = require('./node/util.jsonconfig.js');
/// target
