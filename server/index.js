const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const PORT = 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

wss.on("connection", (ws) => {
  console.log("Client connected");

  ws.on("message", (message) => {
    console.log(`recieved: ${message}`);
    ws.send(`This is my response 🗣`);
  });

  ws.send("Nice connection bro 🔥");
});

app.get("/", () => {
  res.send("Helo");
});

server.listen(PORT, () => console.log(`\x1b[32mRunning on ${PORT} \x1b[0m`));
