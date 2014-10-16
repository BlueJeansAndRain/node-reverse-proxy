"use strict";

function isPlainObject(test)
{
	return (test != null && typeof test === 'object' && test.constructor === Object);
}

function isArrayLike(test)
{
	return (test != null && typeof test === 'object' && typeof test.splice === 'function' && test.hasOwnProperty('length') && typeof test.length === 'number');
}

function isDOMNode(test, nodeType)
{
	return test != null && typeof test === 'object' && typeof test.nodeType === 'number' && (nodeType == null || test.nodeType === nodeType);
}

function isDOMElement(test)
{
	return isDOMNode(test, 1);
}

function isDOMText(test)
{
	return isDOMNode(test, 3);
}

function isDOMDocument(test)
{
	return isDOMNode(test, 9);
}

function isJQuery(test)
{
	return typeof jQuery === 'function' && test instanceof jQuery;
}

var coerce; /// require type.coerce.js

/// export isPlainObject as isPlainObject
/// export isArrayLike as isArrayLike
/// export isDOMNode as isDOMNode
/// export isDOMElement as isDOMElement
/// export isDOMText as isDOMText
/// export isDOMDocument as isDOMDocument
/// export isJQuery as isJQuery
/// export coerce as coerce
/// target none
	coerce = require('./type.coerce.js');
	exports.isPlainObject = isPlainObject;
	exports.isArrayLike = isArrayLike;
	exports.isDOMNode = isDOMNode;
	exports.isDOMElement = isDOMElement;
	exports.isDOMText = isDOMText;
	exports.isDOMDocument = isDOMDocument;
	exports.isJQuery = isJQuery;
	exports.coerce = coerce;
/// target
