Proxima
=======

An [HTTP](http://en.wikipedia.org/wiki/Http) and [TLS](http://en.wikipedia.org/wiki/Transport_Layer_Security) ([HTTPS](http://en.wikipedia.org/wiki/Https)) [reverse proxy](http://en.wikipedia.org/wiki/Reverse_proxy) server intended to replace full web servers for proxying Node.js applications.

In a classic [Apache](http://httpd.apache.org/) or [Nginx](http://wiki.nginx.org/Main) web server configuration, you would use [virtual hosting](http://en.wikipedia.org/wiki/Virtual_Hosting) to host multiple sites on a single IP address. When making the switch to Node, you're faced with a few choices for continuing to host multiple sites per IP address.

* The standard solution is to continue using a regular web server as a proxy for your Node processes.
	* Requires maintaining an extra layer in your stack.
* An easier but less robust solution is to put all of your sites into a single node application.
	* Sites are not self contained.
	* You must restart all sites to restart one.
	* If a single site dies, the entire Node process may be compromised.

Proxying requests through a single gateway server to multiple Node processes is the normally recommended solution because it allows you to...

* Host sites on multiple machines.
* Restart or reset a single site.
* Write Node site applications that are simple to test and develop as stand alone scripts. All they need to know for proxy operation is the appropriate endpoint for listening.

Proxima is a purpose built web server for proxying requests to other Node processes. It takes the place of a regular web server when you don't need it for anything except proxying requests. The configuration is much simpler and you get Javascript _truly_ all the way down.

FYI, there's no reason you can't use Proxima as a gateway to non-Node servers.

Installation
------------

You can install Proxima using `npm` which is the prefered method.

	sudo npm install -g proxima

You can also checkout proxima from [GitHub](https://github.com/BlueJeansAndRain/proxima)

	git https://github.com/BlueJeansAndRain/proxima.git
	npm install

	# If you want to install the package globally after checking it out.
	sudo npm install -g

Command Line Usage
------------------

	Usage: proxima --help
           proxima [--verbose|--quiet] [--uid=id] [--gid=id] [--workers=number] [--config=filename]

	Options:
	  --help         Display this help text.
	  --config, -c   Set the configuration file path.  [default: "./proxima.json"]
	  --verbose, -v  Print log messages to stderr.
	  --quiet, -q    Do not print log messages to stderr.
	  --uid, -u      The user ID to use after listeners have been bound.
	  --gid, -g      The group ID to use after listeners have been bound.
	  --workers, -w  The number of worker processes to spawn.

Configuration File
------------------

Configuration files should contain a JSON object.

Example:

	{
		"verbose": false,
		"workers": 2,
		"uid": 1010,
		"gid": "www",
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

### Configuration Options

#### verbose

True to print log messages to the STDERR stream. This option can be overridden by the command line `--verbose` or `--quiet` options.

Defaults to false.

#### workers

The number of cluster works you want Proxima to use. If zero, the master process will handle requests.

Defaults to 0.

#### uid

Either an integer ID or string name of a user that the Proxima process should run as. This will only work if the process is launched with root permissions. This allows proxima to bind to ports below 1024, and then reduce it's permissions to avoid being used for evil.

Defaults to the current user's ID.

#### gid

Either an integer ID or a string name of a group that the Proxima should run as.

Defaults to the current user's group ID.

#### listeners

An array of [endpoints](#configuration-endpoints) that Proxima should listen on.

_Note: An incoming connection on a secure listener can only match secure routes, and vise versa._

#### routes

An array of objects describing how Proxima should proxy incoming connections on listeners.

Each route object _must_ have the following two properties.

##### hostname

A string representing a named host pattern, or an array of hostname patterns. Hostname patterns can contain wildcard characters.

Wildcards:

* An astrisk `*` matches any number of characters without restriction.
* A question mark `?` matches any number of non-separator characters.
	* Separators are colons `:` which are used for IPv6 octet separation, or periods `.` which are used for IPv4 octet and domain name separation.

##### to

An [endpoint](#configuration-endpoints) that Proxima should bi-directionally forward data to when the hostname of an incoming connection matches the route hostname pattern.

#### 404

An optional boolean or [endpoint](#configuration-endpoints) value which tells Proxima what to do if an incoming request does not match a route.

Defaults to true.

##### Boolean

True will allow Proxima to display its own error page for non-secure connections. False will close the connection without responding.

##### Endpoint

Proxy the incoming unmatched connection.

#### 500

An optional boolean or [endpoint](#configuration-endpoints) value which tells Proxima what to do if an incoming request matches a route, but an error occurs when attempting to connect to the route's `to` endpoint.

Defaults to true.

#### 505

An optional boolean or [endpoint](#configuration-endpoints) value which tells Proxima what to do if an incoming request matches a route and a connection is successfully made to the route's `to` endpoint, but an error or timeout occurs on the proxy socket before the upstream server sends a response.

Defaults to true.

### Configuration Endpoints

Endpoints can be numbers, strings, or objects.

#### Number

A number represents an IP port and is equivalent to the object value `{ port: number }`.

#### String

A string represents a socket path and is equivalent to the object value `{ path: string }`.

#### Object

An object endpoint _must_ contain a `port` or `path` property, but _not_ both. The following object properties are recognized.

##### port

A number from 1 to 65535 indicating the [port](http://en.wikipedia.org/wiki/Port_%28computer_networking%29) of an IP address endpoint.

##### host

A string IPv4 or IPv6 address. This property is only meaningful if the `port` property is set.

If no `host` property is present, listeners will listen on all available IPv4 addresses, and routes will connect to localhost.

##### path

A string value which represents a UNIX filesystem socket path.

##### secure

True indicates that the socket will be used to transmit secure (TLS) data.

Defaults to false.

HTTP
----

Proxima is not all that picky about the format of an HTTP request. It's _so_ not-picky that you could use it with any text protocol that has HTTP-like headers. As long as the first packet of a request contains newline separated utf8 text, and before the first double line break there is at least one line that looks like `Host: some.hostname.com`, it will attempt to route the request based on that "header".

TLS (HTTPS)
-----------

[SNI](http://en.wikipedia.org/wiki/Server_Name_Indication) is supported for detecting the hostname of a secure request.

Proxima does not need to know about your certificates. It peeks at the TLS/SNI extension headers (which are not encrypted) and forwards the encrypted data as-is. There is no need for Proxima to read or modify the encrypted payload.

### SNI Browser Support

Most modern browsers should support it.

The following browsers **do not** support SNI:

* All Internet Explorer versions in Windows XP
* Internet Explorer versions earlier than 7 in _any_ version of windows
* Android's standard browser before Honeycomb (v3.x)

WebSockets
----------

They should just work.

The initial negotation of for a [WebSocket](http://en.wikipedia.org/wiki/WebSocket) is done via HTTP, which means Proxima can route them normally. Once a socket has been routed, data is passively/transparently piped between the upstream and downstream sockets, including all WebSocket negotiation and data.
