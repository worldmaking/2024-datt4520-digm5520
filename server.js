#!/bin/node

const fs = require("fs");
const path = require("path");
const url = require("url");
const assert = require("assert");
const http = require("http");
const https = require("https");

const express = require("express");
const ws = require("ws");
const { v4: uuidv4 } = require("uuid");

// this is used on the server to load in settings from a .env file:
const dotenv = require("dotenv").config();

// configuration:
let server_udpate_ms = 50;
let client_timeout_seconds = 1; // seconds of inactivity to remove a client

// we need this configuration to enable HTTPS where this is supported
// (because HTTPS is a requirement for WebXR)
const IS_HTTP = !process.env.PORT_HTTP;
const PORT_HTTP = IS_HTTP
  ? process.env.PORT || 3000
  : process.env.PORT_HTTP || 80;
const PORT_HTTPS = process.env.PORT_HTTPS || 443;
const PORT = IS_HTTP ? PORT_HTTP : PORT_HTTPS;

// this is where our HTML files etc. live:
const PUBLIC_PATH = path.join(__dirname, "public");

// create a server
const app = express();
// serve all content in the /public folder as static HTML
app.use(express.static(PUBLIC_PATH));
// also now your default route should probably send the contents of "index.html":
app.get("/", function (req, res) {
  res.sendFile(PUBLIC_PATH);
});

// allow cross-domain access (CORS)
// so that we can load assets from other websites
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  return next();
});

// Attempt to load the shared state from 'shared_state.json' on startup

// promote http to https if necessary:
if (!IS_HTTP) {
  http
    .createServer(function (req, res) {
      res.writeHead(301, {
        Location: "https://" + req.headers["host"] + req.url,
      });
      res.end();
    })
    .listen(PORT_HTTP);
}
// create the primary server:
const server = IS_HTTP
  ? http.createServer(app)
  : https.createServer(
      {
        key: fs.readFileSync(process.env.KEY_PATH),
        cert: fs.readFileSync(process.env.CERT_PATH),
      },
      app,
    );

// start the server:
server.listen(PORT, function () {
  console.log("\nNode.js listening on port " + PORT);
});

//... and after we've set up our 'app' server:
// add a websocket server for continuous communication with clients:
const wss = new ws.Server({ server });
wss.binaryType = "arraybuffer";

// this is the shared state we will send to all clients:
let shared = {
  avatars: [],
  creatures: [],
};

let avatarHistory = [];

try {
  const data = fs.readFileSync("shared_state.json", "utf8");
  shared = JSON.parse(data);
  console.log("Shared state loaded from 'shared_state.json'");
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("No existing 'shared_state.json' to load.");
  } else {
    console.error("Failed to load state from 'shared_state.json':", error);
  }
}

avatarHistory = [...shared.avatars];

let userData = {};

try {
  const data = fs.readFileSync("user_data.json", "utf8");
  userData = JSON.parse(data);
  console.log("Shared state loaded from 'user_data.json'");
} catch (error) {
  if (error.code === "ENOENT") {
    console.log("No existing 'user_data.json' to load.");
  } else {
    console.error("Failed to load state from 'user_data.json':", error);
  }
}

// handle each new connections from a client:
wss.on("connection", function (client, request) {
  // Initially, uuid and avatar are undefined until user logs in:
  let uuid = undefined;
  let avatar = undefined;

  client.on("error", console.error);

  client.on("message", function message(data) {
    if (data.toString().substring(0, 1) == "{") {
      let msg = JSON.parse(data);
      switch (msg.type) {
        case "avatar":
          // verify that the UUID matches:
          if (avatar !== undefined && uuid !== undefined && msg.uuid === uuid) {
            // copy in properties from the message:
            Object.assign(avatar, msg);
            // add a timestamp (so we can check for stale clients)
            avatar.last_message_time = process.uptime();
          }
          break;
        case "login":
			// create random username if no username was given
			if (!msg.username) msg.username = uuidv4()
			
			console.log(msg)
          handleLogin(
            msg,
            client,
            function onLoginSuccess(loggedInUuid, loggedInAvatar) {
              uuid = loggedInUuid;
              avatar = loggedInAvatar;
            },
          );
          break;
        default:
        // console.log('received: %s', msg);
      }
    } else {
      // console.log('received: %s', data);
    }
  });

  client.on("close", function (code, reason) {
    console.log(shared.avatars);
    console.log(`Client with UUID ${uuid} disconnected.)`);
    if (uuid) {
      const index = shared.avatars.findIndex((av) => av.uuid === uuid);
      if (index > -1) {
        shared.avatars.splice(index, 1);
        console.log(
          `Avatar with UUID ${uuid} has been removed from shared.avatars`,
        );
      }
    }
  });

  client.send(JSON.stringify({ type: "uuid", uuid }));
});

// to send a message to *everyone*:
function updateAllClients() {
  // remove stale avatars:
  let t = process.uptime();
  // shared.avatars = shared.avatars.filter(
  //   (a) => t - a.last_message_time < client_timeout_seconds,
  // );

  // send all avatar data:
  {
    if (shared.avatars == undefined) {
      return;
    }
    let msg = JSON.stringify({
      type: "avatars",
      // only send avatars if they have a head position etc.
      avatars: shared.avatars.filter((a) => a.head),
    });
    // console.log(msg);
    wss.clients.forEach((client) => {
      client.send(msg);
    });
  }

  {
    // send all creatures
    let msg = JSON.stringify({
      type: "creatures",
      creatures: shared.creatures,
    });
    wss.clients.forEach((client) => {
      client.send(msg);
    });
  }
}

setInterval(updateAllClients, server_udpate_ms);

function handleLogin(msg, client, callback) {
  const username = msg.username;
  if (userData[username]) {
    const user = userData[username];
    const avatar = avatarHistory.find((a) => a.uuid === user.avatarUUID);
    if (!avatar) {
      console.error("Avatar not found for existing user");
      return;
    }
    client.send(
      JSON.stringify({
        type: "login-success",
        uuid: user.uuid,
        avatar: avatar,
      }),
    );
    callback(user.uuid, avatar); // Update uuid and avatar in the closure
  } else {
    const newUser = createUser(username);
    const newAvatar = createAvatar(newUser.uuid);
    shared.avatars.push(newAvatar);
    avatarHistory.push(newAvatar);
    client.send(
      JSON.stringify({
        type: "login-success",
        uuid: newUser.uuid,
        avatar: newAvatar,
      }),
    );
    console.log(`New user created: ${username}`);
    callback(newUser.uuid, newAvatar); // Update uuid and avatar in the closure
  }
}

function createAvatar(uuid) {
  return {
    type: "avatar",
    uuid: uuid,
    head: {
      pos: [0, 1.5, 0],
      dir: [0, 0, 0, 1], // (quaternion orientation)
    },
    hand1: [0, 0, 0],
    hand2: [0, 0, 0],
    lightball: [0, 0, 0],
    last_message_time: process.uptime(),
    color: 927349, // hex value
    shape: "sphere",
  };
}

function createUser(username) {
  const uuid = uuidv4();
  const newUser = {
    uuid: uuid,
    username: username,
    avatarUUID: uuid,
  };
  userData[username] = newUser;
  return newUser;
}

let isExiting = false;

function saveStateOnExit() {
  if (isExiting) return;
  isExiting = true;

  try {
    shared.avatars = avatarHistory;
    const data = JSON.stringify(shared, null, 2);
    const userdata = JSON.stringify(userData, null, 2);
    fs.writeFileSync("shared_state.json", data);
    fs.writeFileSync("user_data.json", userdata);
    console.log('Shared state saved to "shared_state.json"');
  } catch (error) {
    console.error("Failed to save state:", error);
  } finally {
    process.exit(0);
  }
}

function handleUncaughtException(error) {
  console.error("Uncaught exception:", error);
  process.exit(1);
}

process.on("SIGINT", saveStateOnExit);
process.on("SIGTERM", saveStateOnExit);
process.on("uncaughtException", handleUncaughtException);
