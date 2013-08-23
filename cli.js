#!/usr/bin/env node
"use strict";

var cluster = require('cluster');

function log(message)
{
	if (options.verbose && message != null)
		console.error(''+message);
}

if (cluster.isMaster)
{
	var options = require('./src/cli-master.js').init();
	var proxima = require('./');

	if (options.workerCount <= 0)
	{
		// No workers, so the master process will do the work.

		require('./src/cli-worker.js').init(
			options.worker,
			function(message)
			{
				if (options.verbose && message != null)
					console.error('' + message);
			}
		);
	}
	else
	{
		var exitTimes = [];
		var maxExits = options.workerCount * 10;

		cluster.setupMaster({ silent: false });

		cluster
			.on('fork', function(worker)
			{
				log(worker.id + ':- spawned');

				worker
					.on('message', function(data)
					{
						if (data.is === 'log')
							log(worker.id + ':' + data.message);
						else if (data.is === 'error')
							console.error(worker.id + ':' + data.message);
					})
					.send({
						is: 'init',
						options: options.worker
					});
			})
			.on('listening', function(worker, address)
			{
				log(worker.id + ':- listening on ' + proxima.endpoint.pretty(address));
			})
			.on('exit', function(worker, code)
			{
				log(worker.id + ':- exited (' + code + ')');

				var now = new Date().getTime();
				exitTimes.push(now);
				exitTimes = exitTimes.slice(-maxExits);

				if (exitTimes.length === maxExits && now - exitTimes[0] < 60000)
				{
					console.error('Error: ' + maxExits + ' workers have exited within one minute');
					process.exit(1);
				}
				else
				{
					cluster.fork();
				}
			});

		var i = options.workerCount;
		while (i--)
			cluster.fork();
	}
}
else if (cluster.isWorker)
{
	process.on('message', function(data)
	{
		if (data.is === 'init')
		{
			require('./src/cli-worker.js').init(
				data.options,
				function(message)
				{
					process.send({ is: 'log', message: message });
				}
			);
		}
	});
}
