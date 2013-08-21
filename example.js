"use strict";

/*
 * This is just a basic example of how to use Proxima as a Node.js module.
 */

var http = require('http');
var ws = require('ws').Server;
var proxima = require('./index.js');

var proximaServer = proxima.Server.create()
	.addRoute('127.0.0.1', { port: 8081, host: '127.0.0.1' })
	.addRoute('127.0.0.2', { port: 8082, host: '127.0.0.1' })
	.addRoute('127.0.0.3', { port: 8083, host: '127.0.0.1' })
	.set504({port: 8081, host: '127.0.0.1'})
	.listen(8080, '127.0.0.1')
	.on('connection', function(client)
	{
		console.log('Connection #' + client.index + ' from ' + proxima.endpoint.pretty(client.remotePort, client.remoteAddress));
		console.log(' to ' + proxima.endpoint.pretty(client.localPort, client.localAddress, client.secure));

		client
			.on('hostname', function(hostname)
			{
				console.log('Connection #' + this.index + ' hostname: ' + hostname);
			})
			.on('error', function(err)
			{
				console.log('Connection #' + this.index + ' ' + err);
			})
			.on('warning', function(message)
			{
				console.log('Connection #' + this.index + ' ' + message);
			})
			.on('close', function(/*has_error*/)
			{
				console.log('Connection #' + this.index + ' closed');
			});
	})
	.on('proxy', function(proxy, connectArgs)
	{
		console.log('Connection #' + proxy.client.index + (proxy.client.proxied ? ' re-proxy to ' : ' proxy to ') + proxima.endpoint.pretty(connectArgs));
		proxy.client.proxied = true;
	});

var httpServer = http.createServer(function(req, res)
	{
		var body = 'Hello World!';

		res.writeHead(200, {
			'Content-Length': body.length,
			'Content-Type': 'text/plain'
		});

		res.end(body);
	})
	.listen(8081, '127.0.0.1');

var wsServer = new ws({port: 8082});
wsServer.on('connection', function(ws)
{
	var index = 0;
	var interval = setInterval(function()
	{
		ws.send('' + (++index));
		if (index >= 10)
			ws.close();
	}, 1000);

	ws
		.on('message', function(message)
		{
			console.log('recieved: %s', message);
		})
		.on('close', function()
		{
			console.log('websocket closed');
			clearInterval(interval);
		});
});
