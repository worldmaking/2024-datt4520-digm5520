#!/bin/node

const fs = require('fs');
const path = require("path")
const url = require('url');
const assert = require("assert");
const http = require("http");
const https = require("https");

const express = require('express')
const ws = require('ws')

// this is used on the server to load in settings from a .env file:
const dotenv = require("dotenv").config();

// we need this configuration to enable HTTPS where this is supported
// (because HTTPS is a requirement for WebXR)
const IS_HTTP = (!process.env.PORT_HTTP);
const PORT_HTTP = IS_HTTP ? (process.env.PORT || 3000) : (process.env.PORT_HTTP || 80);
const PORT_HTTPS = process.env.PORT_HTTPS || 443;
const PORT = IS_HTTP ? PORT_HTTP : PORT_HTTPS;

// this is where our HTML files etc. live:
const PUBLIC_PATH = path.join(__dirname, "public");

// create a server
const app = express()
// serve all content in the /public folder as static HTML 
app.use(express.static(PUBLIC_PATH))
// also now your default route should probably send the contents of "index.html":
app.get('/', function (req, res) {
	res.sendFile(PUBLIC_PATH);
});

// allow cross-domain access (CORS)
// so that we can load assets from other websites
app.use(function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	return next();
});

// promote http to https if necessary:
if (!IS_HTTP) {
	http.createServer(function(req, res) {
        res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
        res.end();
    }).listen(PORT_HTTP);
}
// create the primary server:
const server = IS_HTTP ? http.createServer(app) : https.createServer({
	key: fs.readFileSync(process.env.KEY_PATH),
	cert: fs.readFileSync(process.env.CERT_PATH)
}, app);

// start the server:
server.listen(PORT, function() {
	console.log("\nNode.js listening on port " + PORT);
});

//... and after we've set up our 'app' server:
// add a websocket server for continuous communication with clients:
const wss = new ws.Server({ server });
wss.binaryType = 'arraybuffer';

let sharedbuffer = new Float32Array(1024 * 8)

let shared = {
	clients: []
}

// handle each new connections from a client:
wss.on('connection', function(client, request) {
	const ip = request.socket.remoteAddress;
	console.log("I got a connection from", ip);

	let self = {
		hue: Math.random(),
		x: 0.5, 
		y: 0.5
	}
	shared.clients.push(self)

	client.on('error', console.error);

	client.on('message', function message(data) {
		if (data.toString().substring(0,1) == "{") {
			let msg = JSON.parse(data)
			//console.log(msg)

			switch (msg.what) {
				case "pointermove": {
					self.x = msg.x
					self.y = msg.y
				} break;
				default: {
					//console.log('received: %s', msg);
				}
			}

		} else {
			console.log('received: %s', data);
		}
	});

	client.send('hi');
});

// to send a message to *everyone*:
function updateAllClients() {
	//let msg = JSON.stringify(shared)
	let msg = sharedbuffer
	wss.clients.forEach(client => {
		//client.send(msg);
	});
}

setInterval(updateAllClients, 50)