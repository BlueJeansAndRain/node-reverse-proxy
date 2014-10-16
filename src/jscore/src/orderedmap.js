"use strict";

var Class; /// require class.js
/// target none
	Class = require('./class.js');
/// target

var OrderedMap = Class.extend(function OrderedMap()
{
	this.__array = [];
	this.__object = {};
	this.length = 0;
})
.implement({
	set: function(key, value)
	{
		key = ''+key;

		if (this.__object.hasOwnProperty(key))
		{
			this.__object[key].value = value;
		}
		else
		{
			var item = {
				index: this.__array.length,
				key: key,
				value: value
			};

			this.__object[key] = item;
			this.__array.push(this.__object[key]);
			this.length = this.__array.length;
		}

		return this;
	},
	unset: function(key)
	{
		key = ''+key;

		if (this.__object.hasOwnProperty(key))
		{
			var item = this.__object[key];
			delete this.__object[key];
			this.__array.splice(item.index, 1);

			var i = this.__array.length;
			while (i-- && i > item.index)
				this.__array[i].index = i;

			this.length = this.__array.length;
		}

		return this;
	},
	get: function(key)
	{
		key = ''+key;

		if (this.__object.hasOwnProperty(key))
			return this.__object[key].value;

		return void 0;
	},
	getAt: function(index)
	{
		index = +index;

		if (index >= 0 && index < this.__array.length)
			return this.__array[index].value;

		return void 0;
	},
	indexOf: function(key)
	{
		key = ''+key;

		if (this.__object.hasOwnProperty(key))
			return this.__object[key].index;

		return -1;
	},
	keyAt: function(index)
	{
		index = +index;

		if (index >= 0 && index < this.__array.length)
			return this.__array[index].key;

		return null;
	},
	each: function(callback)
	{
		var array = this.__array.slice(0),
			i = 0,
			max = array.length;

		for (; i < max; ++i)
		{
			if (callback.call(array[i].value, array[i].value, array[i].key, array[i].index) === false)
				break;
		}

		return this;
	},
	toArray: function()
	{
		var array = [],
			i = this.__array.length;

		array.length = i;

		while (i--)
			array[i] = this.__array[i].value;

		return array;
	},
	toObject: function()
	{
		var object = {},
			i = this.__array.length,
			item;

		while (i--)
		{
			item = this.__array[i];
			object[item.key] = item.value;
		}

		return object;
	},
	empty: function()
	{
		this.__array.length = 0;
		this.__object = {};
		this.length = 0;
	}
});

/// target web,node
	/// export OrderedMap
/// target none
	module.exports = OrderedMap;
