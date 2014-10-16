"use strict";

var Class; /// require class.js
/// target none
	Class = require('./class.js');
/// target

var Queue = Class.extend(function Queue(initial)
{
	this.__in = [];
	this.__out = [];
	this.length = 0;

	if (initial instanceof Array)
	{
		this.__out = initial.slice(0);
		this.length = this.__out.length;
	}
})
.implement({
	add: function(value)
	{
		this.__in.push(value);
		this.length = this.__in.length + this.__out.length;
	},
	next: function()
	{
		if (this.__out.length === 0)
		{
			var temp = this.__out;
			this.__out = this.__in.reverse();
			this.__in = temp;
		}

		this.length = this.__in.length + (this.__out.length ? (this.__out.length - 1) : 0);

		return this.__out.pop();
	},
	peak: function()
	{
		if (this.__out.length === 0)
			return this.__in[0];
		else
			return this.__out[this.__out.length];
	},
	empty: function()
	{
		this.__in.length = 0;
		this.__out.length = 0;
		this.length = 0;
	}
});

/// export Queue
/// target none
	module.exports = Queue;
