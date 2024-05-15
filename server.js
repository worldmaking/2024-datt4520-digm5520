
const express = require('express')
const ws = require('ws')

const PORT = 3000


const app = express()
// serve all content in the /public folder as static HTML 
app.use(express.static('public'))

// also now your default route should probably send the contents of "index.html":
app.get('/', function (req, res) {
	res.sendFile(path.join("public", "index.html"));
});

const server = app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`)
})

//... and after we've set up our 'app' server:
// add a websocket server for continuous communication with clients:
const wss = new ws.Server({ server });
wss.binaryType = 'arraybuffer';

let sharedbuffer = new Float32Array(1024 *)

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
			console.log(msg)

			switch (msg.what) {
				case "pointermove": {
					self.x = msg.x
					self.y = msg.y
				} break;
				default: {
					console.log('received: %s', msg);
				}
			}

		} else {
			console.log('received: %s', data);
		}
	});

	//client.send('something');
});

// to send a message to *everyone*:
function updateAllClients() {
	//let msg = JSON.stringify(shared)
	let msg = sharedbuffer
	wss.clients.forEach(client => {
		client.send(msg);
	});
}

setInterval(updateAllClients, 25)