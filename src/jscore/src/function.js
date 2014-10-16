"use strict";

var once; /// require function.once.js
var safe; /// require function.safe.js
var prefix; /// require function.prefix.js
var overload; /// require function.overload.js
var varg; /// require function.varg.js
var bindAll; /// require function.bindall.js

/// export once as once
/// export safe as safe
/// export prefix as prefix
/// export overload as overload
/// export varg as varg
/// export bindAll as bindAll

/// target none
	once = require('./function.once.js');
	safe = require('./function.safe.js');
	prefix = require('./function.prefix.js');
	overload = require('./function.overload.js');
	varg = require('./function.varg.js');
	bindAll = require('./function.bindall.js');

	exports.once = once;
	exports.safe = safe;
	exports.prefix = prefix;
	exports.overload = overload;
	exports.varg = varg;
	exports.bindAll = bindAll;
///
