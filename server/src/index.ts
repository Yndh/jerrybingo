import express, { Request, Response } from "express";
import WebSocket from "ws";
import { jerry } from "./jerry";
const http = require("http");

interface Client {
  ws: WebSocket;
  username: string;
  board: string[][];
}

interface Room {
  leader: WebSocket;
  clients: Client[];
  gameStarted: boolean;
  roomCode: string;
}

const PORT: number = 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const rooms: { [key: string]: Room } = {};

wss.on("connection", (ws: WebSocket) => {
  ws.on("message", (msg: WebSocket.Data) => {
    const data: {
      type: string;
      room?: string;
      username?: string;
      text?: string;
    } = JSON.parse(msg.toString());

    console.table(rooms);

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

        rooms[code].clients.push({
          ws: ws,
          username: data.username,
          board: [],
        });
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
          leader: ws,
          clients: [
            {
              ws: ws,
              username: data.username,
              board: [],
            },
          ],
          roomCode: code,
          gameStarted: false,
        };
        ws.send(JSON.stringify({ type: "roomCode", roomCode: code }));
      }
    } else if (data.type === "message") {
      if (data.room && data.text) {
        const room: string = data.room;
        const client = rooms[room].clients.find((client) => client.ws === ws);
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
    } else if (data.type === "start") {
      if (data.room) {
        const code: string = data.room;
        const room = rooms[code];
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }

        if (room.leader !== ws) {
          ws.send(
            JSON.stringify({
              type: "warning",
              message: "Only leader can start game",
            })
          );
          return;
        }

        if (room.gameStarted) {
          ws.send(
            JSON.stringify({
              type: "warning",
              message: "Game has already started",
            })
          );
          return;
        }

        room.gameStarted = true;
        room.clients.forEach((client) => {
          client.board = generateBoard(5);
          sendToClient(
            code,
            {
              type: "gameStarted",
              text: "",
              board: client.board,
            },
            client.ws
          );
        });
      }
    }
  });

  ws.on("close", () => {
    // Handle client leave
    const clientRooms = Object.keys(rooms).filter((code) =>
      rooms[code].clients.some((client) => client.ws === ws)
    );

    clientRooms.forEach((code) => {
      const room = rooms[code];
      const clientIndex = room.clients.findIndex((client) => client.ws === ws);
      if (clientIndex === -1) {
        return;
      }

      const clientToRemove = room.clients[clientIndex];
      room.clients.splice(clientIndex, 1);

      sendToRoom(code, {
        type: "message",
        text: `${clientToRemove.username} left the room`,
      });

      if (clientToRemove.ws === room.leader) {
        if (room.clients.length == 0) {
          delete rooms[code];
          return;
        }

        room.leader = room.clients[0].ws;
        const leader = room.clients[0];

        sendToClient(
          code,
          {
            type: "permission",
            text: "You got promoted to room leader",
          },
          leader.ws
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
    });
  });
});

const generateRoomCode = (): string => {
  const code: string = Math.floor(10000 + Math.random() * 90000).toString();
  return code;
};

const generateBoard = (size: number): string[][] => {
  const board: string[][] = [];

  const availableItems = jerry.sort(() => Math.random() - 0.5);

  for (let i = 0; i < size; i++) {
    board.push([]);
    for (let j = 0; j < size; j++) {
      board[i].push(availableItems[i * 4 + j]);
    }
  }

  return board;
};

const sendToRoom = (
  code: string,
  message: {
    type: string;
    text: string;
    username?: string;
  },
  authorWs?: WebSocket
) => {
  const room: Room | undefined = rooms[code];

  if (room) {
    const playerList = room.clients.map((client) => {
      return {
        username: client.username,
        leader: client.ws === room.leader ? true : false,
      };
    });
    room.clients.forEach((client) => {
      if (client.ws !== authorWs) {
        client.ws.send(JSON.stringify({ ...message, playerList }));
      }
    });
  }
};

const sendToClient = (
  code: string,
  message: {
    type: string;
    text: string;
    board?: string[][];
  },
  clientWs: WebSocket
) => {
  const room: Room | undefined = rooms[code];
  const playerList = room.clients.map((client) => {
    return {
      username: client.username,
      leader: client.ws === room.leader ? true : false,
    };
  });
  clientWs.send(JSON.stringify({ ...message, playerList }));
};

app.get("/", (req: Request, res: Response) => {
  res.send("helo");
});

server.listen(PORT, () => console.log(`\x1b[32mRunning on ${PORT} \x1b[0m`));
