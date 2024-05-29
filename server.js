#!/bin/node

const fs = require("fs");
const path = require("path");
const url = require("url");
const assert = require("assert");
const http = require("http");
const https = require("https");

const express = require("express");
const ws = require("ws");

const AVATAR_FILE = path.join(__dirname, "avatars.json");
const CREATURE_FILE = path.join(__dirname, "creatures.json");
const USERS_FILE = path.join(__dirname, "users.json");

// this is used on the server to load in settings from a .env file:
const dotenv = require("dotenv").config();

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

let sharedbuffer = new Float32Array(1024 * 8);

const users = [{ username: "john_doe", password: "", avatarUUID: "12345" }];

let avatars = {};
let creatures = {};

const { v4: uuidv4 } = require("uuid");

function createDefaultAvatar() {
  const defaultAvatar = {
    type: "avatar",
    uuid: uuidv4(), // 使用 uuid 库生成 UUID
    head: {
      pos: [0, 1.5, 0],
      dir: [0, 0, 0, 1], // quaternion orientation
    },
    hand1: [0, 0, 0],
    hand2: [0, 0, 0],
    lightball: [0, 0, 0],
    color: 0x000000, // hex value, black
    shape: "sphere",
  };
  return defaultAvatar;
}

wss.on("connection", (ws) => {
  ws.on("message", (data) => {
    const msg = JSON.parse(data);
    switch (msg.type) {
      case "avatar":
        handleUpdateAvatar(msg, wss, ws);
        break;
      case "login":
        handleLogin(msg, ws);
        break;
      default:
        console.log("Received unknown message type:", msg.type);
    }
  });
  ws.on("close", () => {});
});

function handleLogin(msg, ws) {
  const { username, password } = msg;
  const user = users.find((u) => u.username === username);

  if (user) {
    if (user.password === password) {
      const avatar = avatars[user.avatarUUID] || null;
      const response = {
        type: "login",
        status: "success",
        message: "Login successful.",
        avatar: avatar,
      };
      ws.send(JSON.stringify(response));
      handleInitialConnection(ws, getAvatars());
    } else {
      const response = {
        type: "login",
        status: "error",
        message: "Invalid password.",
      };
      ws.send(JSON.stringify(response));
    }
  } else {
    const defaultAvatar = createDefaultAvatar();
    avatars[defaultAvatar.uuid] = defaultAvatar;

    const newUser = {
      username: username,
      password: password,
      avatarUUID: defaultAvatar.uuid,
    };
    users.push(newUser);
    const response = {
      type: "login",
      status: "success",
      message: "User created and logged in successfully.",
      avatar: defaultAvatar,
    };
    ws.send(JSON.stringify(response));
    handleInitialConnection(ws, getAvatars());
  }
}

function handleInitialConnection(ws, avatars) {
  const avatarList = Object.values(avatars);
  const message = JSON.stringify({
    type: "avatars",
    avatars: avatarList,
  });
  ws.send(message);
}

function handleUpdateAvatar(avatarUpdate, wss, ws) {
  if (avatarUpdate.type !== "avatar") {
    console.error("Incorrect message type");
    return;
  }

  updateAvatar(avatarUpdate);

  const broadcastMessage = JSON.stringify({
    type: "avatars",
    avatar: Object.values(getAvatars),
  });

  wss.clients.forEach((client) => {
    if (client !== ws && client.readyState === WebSocket.OPEN) {
      client.send(broadcastMessage);
    }
  });
}

function loadAvatars() {
  try {
    const data = fs.readFileSync(AVATAR_FILE, "utf8");
    avatars = JSON.parse(data);
  } catch (error) {
    console.error("Failed to load avatars:", error);
  }
}

function saveAvatars() {
  try {
    const data = JSON.stringify(avatars, null, 2);
    fs.writeFileSync(AVATAR_FILE, data);
  } catch (error) {
    console.error("Failed to save avatars:", error);
  }
}

function getAvatars() {
  return avatars;
}

function updateAvatar(avatar) {
  avatars[avatar.uuid] = avatar;
}

process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  saveAvatars();
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  saveAvatars();
  process.exit(1);
});

process.on("SIGINT", () => {
  console.log("Process terminated (SIGINT)");
  saveAvatars();
  process.exit(0);
});
