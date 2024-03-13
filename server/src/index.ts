import express, { Request, Response } from "express";
import WebSocket from "ws";
const http = require("http");

interface Client {
  ws: WebSocket;
  code: string;
}

interface Room {
  master: WebSocket;
  clients: WebSocket[];
  roomCode: string;
}

const PORT: number = 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients: Client[] = [];
const rooms: { [key: string]: Room } = {};

const generateRoomCode = (): string => {
  const code: string = Math.floor(10000 + Math.random() * 90000).toString();
  return code;
};

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (msg: WebSocket.Data) => {
    const data: {
      type: string;
      room?: string;
      username?: string;
      text?: string;
    } = JSON.parse(msg.toString());

    if (data.type === "join") {
      if (data.room) {
        // Join Room
        const room: string = data.room;
        if (!rooms[room]) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }

        rooms[room].clients.push(ws);
        sendToRoom(room, {
          type: "message",
          text: `${data.username} joined the room`,
        });
      } else {
        // Create New Room
        const code: string = generateRoomCode();
        rooms[code] = {
          master: ws,
          clients: [ws],
          roomCode: code,
        };
        clients.push({ ws, code });
        ws.send(JSON.stringify({ type: "roomCode", roomCode: code }));
      }
    } else if (data.type === "message") {
      if (data.room && data.text) {
        const room: string = data.room;
        const username: string = data.username || "unknown";

        sendToRoom(
          room,
          {
            type: "message",
            username: username,
            text: data.text,
          },
          ws
        );
      }
    }
  });
});

const sendToRoom = (
  room: string,
  message: { type: string; text: string; username?: string },
  authorWs?: WebSocket
) => {
  const roomClients: Room | undefined = rooms[room];

  if (roomClients) {
    roomClients.clients.forEach((client: WebSocket) => {
      if (client !== authorWs) {
        client.send(JSON.stringify(message));
      }
    });
  }
};

app.get("/", (req: Request, res: Response) => {
  res.send("helo");
});

server.listen(PORT, () => console.log(`\x1b[32mRunning on ${PORT} \x1b[0m`));
