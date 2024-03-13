const WebSocket = require("ws");
const express = require("express");
const http = require("http");

const PORT = 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = [];
const rooms = [];

const generateRoomCode = () => {
  const code = Math.floor(10000 + Math.random() * 90000).toString();
  return code;
};

wss.on("connection", (ws) => {
  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "join") {
      if (data.room) {
        // Join Room

        const room = data.room;
        if (!rooms[room]) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }

        rooms[room].clients.push(ws);
        sendToRoom(room, {
          type: "message",
          text: `${data.username} joined the room}`,
        });
      } else {
        // Create New Room
        const code = generateRoomCode();
        rooms[code] = [
          {
            master: ws,
            clients: [ws],
            roomCode: code,
          },
        ];
        clients.push({ ws, code });
        ws.send(
          JSON.stringify({ type: "roomCode", roomCode: code.toString() })
        );
      }
    }
  });
});

const sendToRoom = (room, message) => {
  const roomClients = rooms[room];

  if (roomClients.length > 0) {
    clients.forEach((client) => {
      client.ws.send(JSON.stringify(message));
    });
  }
};

app.get("/", () => {
  res.send("Helo");
});

server.listen(PORT, () => console.log(`\x1b[32mRunning on ${PORT} \x1b[0m`));
