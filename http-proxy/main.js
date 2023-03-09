var http = require('http'),
    httpProxy = require('http-proxy');

httpProxy.createProxyServer({target:'http://localhost:3000'}).listen(8000); // See (†)