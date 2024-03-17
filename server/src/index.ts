import express, { Request, Response } from "express";
import WebSocket from "ws";
import { jerry } from "./jerry";
const http = require("http");

interface Client {
  ws: WebSocket;
  username: string;
  inGame: boolean;
  bingo: boolean;
  board: Cell[][];
  bingoTimestamp?: number;
}

interface Cell {
  value: string;
  checked: boolean;
}

interface Room {
  leader: WebSocket;
  clients: Client[];
  gameStarted: boolean;
  gameTimestamp?: number;
  roomCode: string;
}

interface TopThree {
  username: string;
  bingo: boolean;
  bingoTimestamp?: number;
  gameTimestamp?: number;
  checkedCells: number;
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
      value?: { x: number; y: number };
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
          inGame: false,
          bingo: false,
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
              inGame: false,
              bingo: false,
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
              type: "error",
              message: "Only leader can start game",
            })
          );
          return;
        }

        if (room.gameStarted) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Game has already started",
            })
          );
          return;
        }

        room.gameStarted = true;
        room.gameTimestamp = Date.now();
        room.clients.forEach((client) => {
          client.board = generateBoard(5);
          client.inGame = true;
          client.bingo = false;
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
        sendToRoom(code, {
          type: "message",
          text: "",
        });
      }
    } else if (data.type === "move") {
      if (data.room) {
        const code: string = data.room;
        const room = rooms[code];
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }

        if (!room.gameStarted) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Game must be started",
            })
          );
          return;
        }

        const client = room.clients.find((client) => client.ws === ws);
        if (!client) {
          ws.send(
            JSON.stringify({ type: "error", message: "Client not found" })
          );
          return;
        }

        if (!data.value) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Provide x and y",
            })
          );
          return;
        }

        if (client.bingo) {
          return;
        }

        const { x, y } = data.value;
        const cell = client.board[x][y];

        if (!cell.checked) {
          cell.checked = true;
        } else {
          cell.checked = false;
        }
        sendToRoom(code, {
          type: "message",
          text: `${client.username} ${cell.checked ? "checked" : "unchecked"} ${
            cell.value
          }`,
        });

        const bingo = checkBoard(client.board);
        if (bingo) {
          client.bingo = true;
          client.bingoTimestamp = Date.now();
          sendToClient(
            code,
            {
              type: "bingo",
              text: "",
              board: client.board,
            },
            ws
          );
          sendToRoom(code, {
            type: "message",
            text: `${client.username} got a BINGO!`,
          });

          const playersBingo = checkPlayersBingo(room);
          if (playersBingo) {
            room.gameStarted = false;

            room.clients.map((client) => (client.inGame = false));
            sendToRoom(code, {
              type: "gameEnded",
              text: "",
              leaderboard: getTopThreePlayers(room),
            });
            room.clients.map((client) => (client.bingo = false));
          }
          return;
        }

        sendToClient(
          code,
          {
            type: "board",
            text: "",
            board: client.board,
          },
          ws
        );
      }
    } else if (data.type === "end") {
      if (data.room) {
        const code = data.room;
        const room = rooms[code];
        if (!room) {
          ws.send(JSON.stringify({ type: "error", message: "Room not found" }));
          return;
        }

        if (room.leader !== ws) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Only leader can end game",
            })
          );
          return;
        }

        if (!room.gameStarted) {
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Game must be started",
            })
          );
          return;
        }

        room.gameStarted = false;
        room.clients.map((client) => (client.inGame = false));
        sendToRoom(code, {
          type: "gameEnded",
          text: "",
          leaderboard: getTopThreePlayers(room),
        });
        room.clients.map((client) => (client.bingo = false));
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

const generateBoard = (size: number): Cell[][] => {
  const board: Cell[][] = [];

  const items = jerry.sort(() => Math.random() - 0.5);

  const centerIndex = Math.floor(size / 2);

  for (let i = 0; i < size; i++) {
    board.push([]);
    for (let j = 0; j < size; j++) {
      if (i === centerIndex && j === centerIndex) {
        board[i].push({ value: "FREE", checked: false });
      } else {
        board[i].push({ value: items[i * 4 + j], checked: false });
      }
    }
  }

  return board;
};

const checkBoard = (board: Cell[][]): boolean => {
  const size = board.length;

  for (let x = 0; x < size; x++) {
    let row = true;
    let col = true;

    for (let y = 0; y < size; y++) {
      if (!board[x][y].checked) {
        row = false;
      }
      if (!board[y][x].checked) {
        col = false;
      }
    }
    if (row || col) {
      return true;
    }
  }

  let diagonal = true;
  let antiDiagonal = true;
  for (let x = 0; x < size; x++) {
    if (!board[x][x].checked) {
      diagonal = false;
    }
    if (!board[x][size - 1 - x].checked) {
      antiDiagonal = false;
    }
  }
  if (diagonal || antiDiagonal) {
    return true;
  }

  return false;
};

const checkPlayersBingo = (room: Room): boolean => {
  let playersBingo = true;
  room.clients.forEach((client) => {
    if (!client.bingo && client.inGame) {
      playersBingo = false;
    }
  });

  return playersBingo;
};

const countChecked = (board: Cell[][]): number => {
  let count = 0;
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      if (board[i][j].checked) {
        count++;
      }
    }
  }
  return count;
};

const getTopThreePlayers = (room: Room): TopThree[] => {
  const bingoPlayers = room.clients;

  bingoPlayers.forEach((player) => {
    if (!player.bingoTimestamp) {
      player.bingoTimestamp = Date.now();
    }
  });

  bingoPlayers.sort((a, b) => {
    if (a.bingoTimestamp && b.bingoTimestamp) {
      if (a.bingoTimestamp !== b.bingoTimestamp) {
        return a.bingoTimestamp - b.bingoTimestamp;
      } else {
        return countChecked(a.board) - countChecked(b.board);
      }
    } else {
      return countChecked(a.board) - countChecked(b.board);
    }
  });

  const topThree = bingoPlayers.slice(0, 3).map((player) => {
    return {
      username: player.username,
      bingo: player.bingo,
      bingoTimestamp: player.bingoTimestamp,
      gameTimestamp: room.gameTimestamp,
      checkedCells: countChecked(player.board),
    };
  });

  return topThree;
};

const sendToRoom = (
  code: string,
  message: {
    type: string;
    text: string;
    username?: string;
    leaderboard?: TopThree[];
  },
  authorWs?: WebSocket
) => {
  const room: Room | undefined = rooms[code];

  if (room) {
    const playerList = room.clients.map((client) => {
      return {
        username: client.username,
        leader: client.ws === room.leader ? true : false,
        inGame: client.inGame,
        checkedCells: countChecked(client.board),
        bingo: client.bingo,
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
    board?: Cell[][];
  },
  clientWs: WebSocket
) => {
  const room: Room | undefined = rooms[code];
  const playerList = room.clients.map((client) => {
    return {
      username: client.username,
      leader: client.ws === room.leader ? true : false,
      inGame: client.inGame,
      checkedCells: countChecked(client.board),
      bingo: client.bingo,
    };
  });
  clientWs.send(JSON.stringify({ ...message, playerList }));
};

app.get("/", (req: Request, res: Response) => {
  res.send("helo");
});

server.listen(PORT, () => console.log(`\x1b[32mRunning on ${PORT} \x1b[0m`));
