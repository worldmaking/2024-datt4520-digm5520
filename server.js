#!/bin/node

const fs = require('fs');
const path = require("path")
const url = require('url');
const assert = require("assert");
const http = require("http");
const https = require("https");

const express = require('express')
const ws = require('ws')
const { v4: uuidv4 } = require('uuid');

// this is used on the server to load in settings from a .env file:
const dotenv = require("dotenv").config();

// configuration:
let server_udpate_ms = 250
let client_timeout_seconds = 1 // seconds of inactivity to remove a client

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

// this is the shared state we will send to all clients:
let shared = {
	avatars: [],
	creatures: []
}

// handle each new connections from a client:
wss.on('connection', function(client, request) {
	// create a new unique ID for this session:
	const uuid = uuidv4();
	console.log("I got a connection as ", uuid);

	// create a new entry in our avatar list for this client:
	let avatar = {
		uuid,
		// mark the time when we last had a message
		last_message_time: process.uptime()
	}
	shared.avatars.push(avatar)

	client.on('error', console.error);

	client.on('message', function message(data) {

		if (data.toString().substring(0,1) == "{") {
			let msg = JSON.parse(data)

			switch (msg.type) {
				case "avatar": {
					// verify that the UUID matches:
					if (msg.uuid == uuid) {
						// copy in properties from the message:
						Object.assign(avatar, msg)
						// add a timestamp (so we can check for stale clients)
						avatar.last_message_time = process.uptime()
					}

				} break;
				default: {
					//console.log('received: %s', msg);
				}
			}

		} else {
			//console.log('received: %s', data);
		}
	});

	client.send(JSON.stringify({
		type: "uuid",
		uuid
	}));
});

// to send a message to *everyone*:
function updateAllClients() {

	// remove stale avatars:
	let t = process.uptime()
	shared.avatars = shared.avatars.filter(a => t - a.last_message_time < client_timeout_seconds)
	console.log(process.uptime(), shared)

	// send all avatar data:
	let msg1 = JSON.stringify({
		type: "avatars", 
		avatars: shared.avatars
	})
	wss.clients.forEach(client => {
		client.send(msg1);
	});

	let msg2 = JSON.stringify({
		type: "creatures", 
		creatures: shared.creatures
	})
	wss.clients.forEach(client => {
		client.send(msg2);
	});
}

	
setInterval(updateAllClients, server_udpate_ms)