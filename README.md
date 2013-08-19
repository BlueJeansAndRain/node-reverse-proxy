Proxima
=======

A [reverse proxy](http://en.wikipedia.org/wiki/Reverse_proxy) server for Node.

In a classic [Apache](http://httpd.apache.org/) or [Nginx](http://wiki.nginx.org/Main) web server configuration, you would use virtual hosting to host multiple sites on a single IP address. When making the switch to Node, you're faced with a few choices for continuing to host multiple sites per IP address:

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
