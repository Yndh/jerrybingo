import express, { Request, Response } from "express";
import WebSocket from "ws";
const http = require("http");

interface Client {
  ws: WebSocket;
  username: string;
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

    console.table(clients);

    if (data.type === "join") {
      if (data.room) {
        // Join Room
        const code: string = data.room;
        if (!rooms[code]) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }
        if (!data.username || data.username.trim() == "") {
          ws.send(
            JSON.stringify({ type: "error", message: "No username provided" })
          );
          return;
        }

        clients.push({
          ws: ws,
          username: data.username,
          code: code,
        });
        rooms[code].clients.push(ws);
        sendToRoom(code, {
          type: "message",
          text: `${data.username} joined the room`,
        });
      } else {
        if (!data.username || data.username.trim() == "") {
          ws.send(
            JSON.stringify({ type: "error", message: "No username provided" })
          );
          return;
        }

        // Create New Room
        const code: string = generateRoomCode();
        rooms[code] = {
          master: ws,
          clients: [ws],
          roomCode: code,
        };
        clients.push({
          ws: ws,
          username: data.username,
          code: code,
        });
        ws.send(JSON.stringify({ type: "roomCode", roomCode: code }));
      }
    } else if (data.type === "message") {
      if (data.room && data.text) {
        const room: string = data.room;
        const client = clients.find((client) => client.ws === ws);
        if (!client) {
          ws.send(
            JSON.stringify({ type: "error", message: "No client found" })
          );
          return;
        }
        const username: string = client.username;

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

  ws.on("close", () => {
    // Handle client leave
    const clientToRemove = clients.find((clients) => clients.ws === ws);
    if (!clientToRemove) return;

    const clientRooms = Object.keys(rooms).filter((code) =>
      rooms[code].clients.includes(ws)
    );

    clientRooms.forEach((code) => {
      const room = rooms[code];
      const clientIndex = room.clients.indexOf(ws);
      if (clientIndex === -1) {
        return;
      }

      room.clients.splice(clientIndex, 1);

      sendToRoom(code, {
        type: "message",
        text: `${clientToRemove.username} left the room`,
      });

      if (clientToRemove.ws === room.master) {
        if (room.clients.length == 0) {
          delete rooms[code];
          return;
        }

        room.master = room.clients[0];
        const leader = clients.find((client) => client.ws == room.master);
        if (!leader) return;

        room.master.send(
          JSON.stringify({
            type: "message",
            text: "You got promoted to room leader",
          })
        );
        sendToRoom(
          code,
          {
            type: "message",
            text: `${leader.username} got promoted to room leader`,
          },
          leader.ws
        );
      }
      const clientToRemoveIndex = clients.indexOf(clientToRemove);
      console.log(`Removed ${clientToRemove.username}`);
      clients.splice(clientToRemoveIndex, 1);
    });
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
