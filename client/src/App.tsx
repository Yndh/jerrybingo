// App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const ws = new WebSocket("ws://localhost:8080");

interface Message {
  username?: string;
  text: string;
}

interface Player {
  username: string;
  leader: boolean;
  inGame: boolean;
  checkedCells?: number;
  bingo?: boolean;
}

interface Cell {
  value: string;
  checked: boolean;
}

interface TopThree {
  username: string;
  bingo: boolean;
  bingoTimestamp?: number;
  gameTimestamp?: number;
  checkedCells: number;
}

const App: React.FC = () => {
  const [wsError, setWsError] = useState<string>("");

  //Lobby
  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");

  //Room
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<string>("");
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [createdRoom, setCreatedRoom] = useState<boolean>(false);

  //Game
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [bingo, setBingo] = useState<boolean>(false);

  // Overview
  const [overview, setOverview] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<TopThree[]>([]);

  useEffect(() => {
    ws.onopen = () => {
      setWsError("");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log(data);

      if (data.type === "message") {
        console.table(data);
        setMessages((prevMessages) => [
          ...prevMessages,
          { username: data.username, text: data.text },
        ]);
        setPlayerList(data.playerList);
      } else if (data.type === "permission") {
        console.table(data);
        setCreatedRoom(true);
        setMessages((prevMessages) => [
          ...prevMessages,
          { username: data.username, text: data.text },
        ]);
        setPlayerList(data.playerList);
      } else if (data.type === "roomCode") {
        setRoom(data.roomCode);
        setMessages([]);
      } else if (data.type === "gameStarted") {
        setBoard(data.board);
        setGameStarted(true);
      } else if (data.type === "board") {
        setBoard(data.board);
      } else if (data.type === "bingo") {
        setBoard(data.board);
        setBingo(true);
        toast.success("BINGO!");
      } else if (data.type === "gameEnded") {
        setBoard([]);
        setBingo(false);
        setGameStarted(false);
        setLeaderboard(data.leaderboard);
        setPlayerList(data.playerList);
        setOverview(true);
      } else if (data.type === "error") {
        toast.error(data.message);
        setUsername("");
        setRoom("");
        setMessages([]);
      }
    };

    ws.onclose = () => {
      setWsError("Conenction closed");
    };
  }, []);

  const createRoom = () => {
    setCreatedRoom(true);
    ws.send(JSON.stringify({ type: "join", username: username }));
    setPlayerList([{ username, leader: true, inGame: false }]);
  };

  const joinRoom = () => {
    if (roomCode.trim() == "") {
      alert("Please enter a room code");
      return;
    }
    ws.send(
      JSON.stringify({ type: "join", username: username, room: roomCode })
    );
    setRoom(roomCode);
    setRoomCode("");
    setMessages([]);
  };

  const sendMessage = () => {
    if (message.trim() == "") {
      alert("Please enter message");
      return;
    }

    ws.send(
      JSON.stringify({
        type: "message",
        text: message,
        room: room,
      })
    );
    setMessages((prevMessages) => [
      ...prevMessages,
      { username: username, text: message },
    ]);
    setMessage("");
  };

  const startGame = () => {
    ws.send(
      JSON.stringify({
        type: "start",
        room: room,
      })
    );
  };

  const makeMove = (x: number, y: number) => {
    ws.send(
      JSON.stringify({
        type: "move",
        room: room,
        value: { x, y },
      })
    );
  };

  const endGame = () => {
    ws.send(
      JSON.stringify({
        type: "end",
        room: room,
      })
    );
  };

  const goToLobby = () => {
    setOverview(false);
  };

  const calculateTimeDifference = (startTime: number, endTime: number) => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const timeDiff = Math.abs(end - start);

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <div className="App">
      <ToastContainer position="bottom-right" theme="dark" />

      {/* Error */}
      {wsError && <h1>{wsError}</h1>}

      {/* Main Page */}
      {!room && !wsError && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <h1>Welcome</h1>
          <label htmlFor="usernameInput">Username</label>
          <input
            type="text"
            id="usernameInput"
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <label htmlFor="roomCode">Room Code</label>
          <input
            type="text"
            id="roomCode"
            placeholder="Room Code"
            onChange={(e) => setRoomCode(e.target.value)}
          />
          <div style={{ display: "flex", gap: 15 }}>
            <button
              onClick={joinRoom}
              disabled={!(roomCode.trim() !== "" && username.trim() !== "")}
            >
              Join room
            </button>
            <button onClick={createRoom} disabled={username.trim() == ""}>
              Create room
            </button>
          </div>
        </div>
      )}

      {/* Lobby */}
      {room && !wsError && !gameStarted && !overview && (
        <>
          <h1>Room {room}</h1>
          <h3>Players</h3>
          <ul>
            {playerList
              .filter((player: Player) => player.inGame)
              .sort((a: Player, b: Player) => {
                const checkedCellsA = a.checkedCells || 0;
                const checkedCellsB = b.checkedCells || 0;

                if (checkedCellsA !== checkedCellsB) {
                  return checkedCellsB - checkedCellsA;
                }
                return b.bingo ? 1 : -1;
              })
              .map((player: Player, index: number) => (
                <li key={index}>
                  {player.leader ? "👑" : ""}
                  {player.username + " "}
                  <b>{" [In Game]"}</b>
                </li>
              ))}
          </ul>
          <ul style={{ opacity: 0.7 }}>
            {playerList
              .filter((player: Player) => !player.inGame)
              .map((player: Player, index: number) => (
                <li key={index}>
                  {player.leader ? "👑" : ""}
                  {player.username}
                </li>
              ))}
          </ul>
          <h3>Chat</h3>
          <ul>
            {messages.map((message: Message, index: number) => (
              <li key={index}>
                {message.username ? `[${message.username}]: ` : ""}{" "}
                {message.text}
              </li>
            ))}
          </ul>
          <input
            type="text"
            placeholder="Text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>Send</button>

          {createdRoom ? (
            <button
              style={{ width: "100%", marginTop: 25 }}
              onClick={startGame}
            >
              Start Game
            </button>
          ) : (
            <h4>Waiting for leader to start game...</h4>
          )}
        </>
      )}

      {/* Game */}
      {room && gameStarted && !wsError && !overview && (
        <div className="gameContainer">
          <div className="game">
            <h2>Game Board</h2>
            <div className="game-board">
              {board.map((row, rowIndex) => (
                <div key={rowIndex} className="board-row">
                  {row.map((cell, columnIndex) => (
                    <div
                      key={columnIndex}
                      className={`board-cell ${cell.checked ? "checked" : ""}`}
                      onClick={() => makeMove(rowIndex, columnIndex)}
                    >
                      <span>{cell.value}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="sideBar">
            <h3>Chat</h3>
            <ul>
              {messages.map((message: Message, index: number) => (
                <li key={index}>
                  {message.username ? `[${message.username}]: ` : ""}{" "}
                  {message.text}
                </li>
              ))}
            </ul>
            <input
              type="text"
              placeholder="Text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>

            <h3>Players</h3>
            <ul>
              {playerList
                .filter((player: Player) => player.inGame)
                .sort((a: Player, b: Player) => {
                  if (a.bingo && !b.bingo) {
                    return -1;
                  } else if (!a.bingo && b.bingo) {
                    return 1;
                  } else {
                    const checkedCellsA = a.checkedCells || 0;
                    const checkedCellsB = b.checkedCells || 0;

                    return checkedCellsB - checkedCellsA;
                  }
                })
                .map((player: Player, index: number) => (
                  <li key={index}>
                    {player.leader ? "👑" : ""}
                    {player.username + " "}
                    {player.checkedCells}/{board.length * board.length}
                    {player.bingo && " 🔥[BINGO]🔥"}
                  </li>
                ))}
            </ul>
            <ul style={{ opacity: 0.7 }}>
              {playerList
                .filter((player: Player) => !player.inGame)
                .map((player: Player, index: number) => (
                  <li key={index}>
                    {player.leader ? "👑" : ""}
                    {player.username}
                    {" [Lobby]"}
                  </li>
                ))}
            </ul>

            {createdRoom && <button onClick={endGame}>End game</button>}
          </div>
        </div>
      )}

      {/* Overview */}
      {room && overview && !wsError && !gameStarted && (
        <div>
          <ol>
            {leaderboard.map((topThree: TopThree, index: number) => (
              <li key={index}>
                <strong>{topThree.username}</strong>
                {topThree.bingoTimestamp && topThree.gameTimestamp && (
                  <span>
                    {" "}
                    - Game Time:{" "}
                    {calculateTimeDifference(
                      topThree.gameTimestamp,
                      topThree.bingoTimestamp
                    )}
                  </span>
                )}
                <span> - Checked Cells: {topThree.checkedCells}</span>
              </li>
            ))}
          </ol>
          <button onClick={goToLobby}>Play again</button>
        </div>
      )}
    </div>
  );
};

export default App;
