Proxima
=======

An [HTTP](http://en.wikipedia.org/wiki/Http) and [TLS](http://en.wikipedia.org/wiki/Transport_Layer_Security) [reverse proxy](http://en.wikipedia.org/wiki/Reverse_proxy) server intended to replace full web servers for proxying Node.js applications.

In a classic [Apache](http://httpd.apache.org/) or [Nginx](http://wiki.nginx.org/Main) web server configuration, you would use [virtual hosting](http://en.wikipedia.org/wiki/Virtual_Hosting) to host multiple sites on a single IP address. When making the switch to Node, you're faced with a few choices for continuing to host multiple sites per IP address:

* The standard solution is to continue using a regular web server as a proxy for your Node processes.
	* Requires maintaining an extra layer in your stack.
* An easier but less robust solution is to put all of your sites into a single node application.
	* Sites are not self contained.
	* You must restart all sites to restart one.
	* If a single site dies, the entire Node process may be compromised.

Proxying requests through a single gateway server to multiple Node processes is the normally recommended solution for the following reasons.

* Host sites on multiple machines.
* Restart or reset a single site.
* Write Node site applications that are simple to test and develop as stand alone scripts. All they need to know for proxy operation is the appropriate endpoint for listening.

Proxima is a purpose built web server for proxying incoming requests to other Node processes. It takes the place of a regular web server when you don't need a full web server for anything except proxying requests to Node. The configuration is much simpler and you get Javascript _trully_ all the way down.

[SNI](http://en.wikipedia.org/wiki/Server_Name_Indication) is supported for virtual hosting secure sites. _Windows XP, IE versions earlier than 9, and older Android browser will have problems._ Modern browsers should all support SNI. Proxima does not need to know about your certificates. It peaks at the SNI headers which are not encrypted and forwards the encrypted data as-is. There is no need for Proxima to read or modify the encrypted payload.

FYI, there's no reason you can't use Proxima as a gateway to non-Node servers.

Usage
-----

	Usage: proxima --help
           proxima [--verbose] [--config=filename]

	Options:
	  --help         Display this help text.
	  --config, -c   Set the configuration file path.  [default: "./proxima.json"]
	  --verbose, -v  Print log messages to stderr.

Configuration File
------------------

Configuration files should contain a JSON object.

Example:

	{
		"verbose": false,
		"listeners": [
			8080,
			{ "port": 8081 },
			{ "port": 8082, "secure": true },
			{ "port": 8083, "host": "127.0.0.1" },
			{ "port": 8084, "host": "127.0.0.1", "secure": true },
			"/tmp/listener1.sock",
			{ "path": "/tmp/listener2.sock" },
			{ "path": "/tmp/listener2.sock", "secure": true }
		],
		"routes": [
			{
				"hostname": "a.com",
				"to": 8090
			},
			{
				"hostname": "b.com",
				"to": { "port": 8091 }
			},
			{
				"hostname": "a.?.com",
				"to": { "port": 8092, "host": "127.0.0.1", "secure": true }
			},
			{
				"hostname": "*.b.com",
				"to": "/tmp/upstream1.sock"
			},
			{
				"hostname": "c*d.com",
				"to": { "path": "/tmp/upstream2.sock" }
			},
			{
				"hostname": [
					"e?f.com",
					"g.?",
					"h.*"
				],
				"to": 8093
			}
		],
		"404": { "port": 8085, "host": "127.0.0.1" },
		"500": { "path": "/tmp/404.sock" },
		"504": false
	}
