"use strict";

var Class; /// require class.js
var prefix; /// require function.prefix.js
/// target none
	Class = require('./class.js');
	prefix = require('./function.prefix.js');
/// target

var Overload = Class.extend(function Overload(options)
{
	this.fn = null;
	this.argPrototypes = [];
	this.minArgs = 0;
	this.extraArgs = true;

	if (options instanceof Function)
	{
		this.fn = options;
		this.minArgs = this.argPrototypes.length = this._function.length;
	}
	else if (options instanceof Object)
	{
		this.fn = options.call instanceof Function ? options.call : function() {};

		if (options.extraArgs === false)
			this.extraArgs = false;
		else if (options.extraArgs === 'array')
			this.extraArgs = 'array';

		if (options.args != null)
		{
			var protos = options.args;

			if (!(protos instanceof Array))
				protos = [protos];

			if (protos instanceof Array)
			{
				var i = 0, max = protos.length;
				for (; i < max; ++i)
					this.addArgPrototype(protos[i]);
			}
		}
	}
	else
	{
		throw new Error("Expecting object or function");
	}
})
.implement({
	check: function(args)
	{
		if (args.length < this.minArgs)
			return false;

		args = Array.prototype.slice.call(args, 0);

		var resolvedArgs = [],
			i = 0,
			max = this.argPrototypes.length,
			proto;

		for (; i < max; ++i)
		{
			proto = this.argPrototypes[i];

			if (proto.tests === 'value')
			{
				resolvedArgs.push(proto._);
				continue;
			}

			if (this.checkArg(proto, args[0]))
				resolvedArgs.push(args.shift());
			else if (proto.optional)
				resolvedArgs.push(proto._);
			else
				return false;
		}

		if (args.length > 0)
		{
			switch (this.extraArgs)
			{
				case true:
					resolvedArgs = resolvedArgs.concat(args);
					break;
				case 'array':
					resolvedArgs.push(args);
					break;
				case false:
					return false;
			}
		}

		return resolvedArgs;
	},
	checkArg: function(proto, arg)
	{
		var i = 0,
			max = proto.tests.length;

		for (; i < max; ++i)
		{
			if (proto.tests[i](arg) !== false)
				return true;
		}

		return false;
	},
	addArgPrototype: function(proto)
	{
		if (!(proto instanceof Object) || proto.constructor !== Object)
			proto = { type: proto };

		proto = {
			tests: this.makeTests(proto.type),
			optional: !!proto.optional,
			_: proto._ == null ? null : proto._
		};

		if (proto.optional)
		{
			if (proto.tests === 'value')
				throw new Error("Type value cannot be optional");
		}
		else
		{
			++this.minArgs;
		}

		this.argPrototypes.push(proto);
	},
	makeTests: function(types)
	{
		if (!(types instanceof Array))
			types = [types];

		var tests = [],
			i = 0,
			max = types.length,
			type,
			test;

		for (; i < max; ++i)
		{
			type = this.normalizeType(types[i]);

			if (type.is === 'value')
			{
				if (types.length !== 1)
					throw new Error("Type value must be singlular");
				else
					return 'value';
			}

			test = this.makeSingleTest(type);
			tests.push(test);
		}

		return tests;
	},
	normalizeType: function(type)
	{
		var norm = type;

		if (norm == null || typeof norm === 'string' || norm instanceof Function || norm instanceof RegExp || norm instanceof Array)
			norm = { is: norm };
		else if (!(norm instanceof Object))
			throw new Error("Invalid argument type");

		if (typeof norm.is === 'string')
		{
			norm = { is: this.normalizeTypeName(norm.is) };
			if (norm.is === 'range')
			{
				norm.min = type.min;
				norm.max = type.max;
			}
			else if ((/^(regex|set|type|test)$/).test(norm.is))
			{
				norm[norm.is] = type[norm.is];
			}
		}
		else if (norm.is == null)
			norm = { is: 'any' };
		else if (norm.is instanceof RegExp)
			norm = { is: 'regex', regex: norm };
		else if (norm.is instanceof Array)
			norm = { is: 'set', set: norm };
		else if (norm.is instanceof Function)
			norm = { is: 'test', test: norm };
		else
			throw new Error("Invalid argument type");

		return norm;
	},
	normalizeTypeName: function(name)
	{
		name = name.toLowerCase();

		switch (name)
		{
			case '=':
				return 'value';
			case '*':
			case 'all':
				return 'any';
			case 'bool':
				return 'boolean';
			case '#':
			case 'float':
				return 'number';
			case 'int':
				return 'integer';
			case 'hexadecimal':
				return 'hex';
			case 'oct':
				return 'octal';
			case '~':
			case 'regexp':
				return 'regex';
			case 'list':
				return 'set';
			case 'instance':
			case 'class':
				return 'type';
		}

		return name;
	},
	makeSingleTest: function(type)
	{
		switch (type.is)
		{
			case 'regex':
				if (type.regex != null)
				{
					if (!(type.regex instanceof RegExp))
						throw new Error("Expecting RegExp `regex` parameter");
					return prefix(this.types.testregex, type.regex);
				}
				/* falls through */
			case 'any':
			case 'null':
			case 'boolean':
			case 'number':
			case 'integer':
			case 'numeric':
			case 'hex':
			case 'octal':
			case 'string':
			case 'object':
			case 'anyobject':
			case 'array':
			case 'function':
				return this.types[type.is];
			case 'set':
				if (!(type.set instanceof Array))
					throw new Error("Expecting Array `set` parameter");
				return prefix(this.types.set, type.set);
			case 'type':
				if (!(type.type instanceof Function))
					throw new Error("Expecting Function `type` parameter");
				return prefix(this.types.type, type.type);
			case 'range':
				return prefix(this.types.range, type.min, type.max);
			case 'test':
				if (!(type.test instanceof Function))
					throw new Error("Expecting Function `test` parameter");
				return type.value;
		}

		throw new Error("Invalid argument type");
	},
	types: {
		'value': 'value',
		'any': function()
		{
			return true;
		},
		'null': function(arg)
		{
			return arg == null;
		},
		'boolean': function(arg)
		{
			return typeof arg === 'boolean';
		},
		'number': function(arg)
		{
			return typeof arg === 'number';
		},
		'integer': function(arg)
		{
			return (typeof arg === 'number') && (arg % 1 === 0);
		},
		'numeric': function(arg)
		{
			return (typeof arg === 'string') && (/^\s*-?(\d+|0x[0-9a-f]+|\d*\.\d+)\s*$/i).test(arg);
		},
		'hex': function(arg)
		{
			return (typeof arg === 'string') && (/^\s*-?(0x)?[0-9a-f]+\s*$/i).test(arg);
		},
		'octal': function(arg)
		{
			return (typeof arg === 'string') && (/^\s*-?[0-7]+\s*$/).test(arg);
		},
		'string': function(arg)
		{
			return typeof arg === 'string';
		},
		'object': function(arg)
		{
			return (arg instanceof Object) && !(arg instanceof Array) && !(arg instanceof Function) && !(arg instanceof RegExp);
		},
		'anyobject': function(arg)
		{
			return (arg instanceof Object);
		},
		'array': function(arg)
		{
			return (arg instanceof Array);
		},
		'function': function(arg)
		{
			return (arg instanceof Function);
		},
		'regex': function(arg)
		{
			return (arg instanceof RegExp);
		},
		'testregex': function(rx, arg)
		{
			return (typeof arg === 'string') && rx.test(arg);
		},
		'set': function(set, arg)
		{
			return (set.indexOf(arg) >= 0);
		},
		'type': function(constructor, arg)
		{
			return (arg instanceof Object) && (arg instanceof constructor);
		},
		'range': function(min, max, arg)
		{
			return ((min == null || arg >= min) && (max == null || arg <= max));
		}
	}
});

var OverloadList = Class.extend(function OverloadList(protos)
{
	this.list = [];

	var i = 0, max = protos.length;
	for (; i < max; ++i)
		this.list.push(new Overload(protos[i]));
})
.implement({
	resolve: function(args)
	{
		var i = 0,
			max = this.list.length,
			resolvedArgs;

		for (; i < max; ++i)
		{
			if (resolvedArgs = this.list[i].check(args))
			{
				return {
					fn: this.list[i].fn,
					args: resolvedArgs
				};
			}
		}

		throw new Error("Invalid arguments (no matching overload)");
	}
});

var overload = function()
{
	var overloads = new OverloadList(arguments);

	return function()
	{
		var overload = overloads.resolve(arguments);
		return overload.fn.apply(this, overload.args);
	};
};

/// export overload
/// target none
	module.exports = overload;
/// target
