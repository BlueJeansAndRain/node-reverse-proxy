"use strict";

var http = require('http');
var proxima = require('./index.js');

var proximaServer = proxima.Server.create()
	.addRoute('127.0.0.1', { port: 8081, host: '127.0.0.1' })
	.addRoute('127.0.0.2', { port: 8081, host: '127.0.0.2' }) // No Upstream Response
	.addRoute('127.0.0.3', {}) // Invalid Route
	// 127.0.0.4 - Missing Route
	.listen(8080, '127.0.0.1');

var httpServer = http.createServer(function(req, res)
{
	var body = 'Hello World!';

	res.writeHead(200, {
		'Content-Length': body.length,
		'Content-Type': 'text/plain'
	});

	res.end(body);
}).listen(8081, '127.0.0.1');
