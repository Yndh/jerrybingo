// App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";

const ws = new WebSocket("ws://localhost:8080");

interface message {
  username?: string;
  text: string;
}

interface player {
  username: string;
  leader: boolean;
}

const App: React.FC = () => {
  const [wsError, setWsError] = useState<string>("");

  //Lobby
  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");

  //Room
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<message[]>([]);
  const [room, setRoom] = useState<string>("");
  const [playerList, setPlayerList] = useState<player[]>([]);
  const [createdRoom, setCreatedRoom] = useState<boolean>(false);

  //Game
  const [board, setBoard] = useState<string[][]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);

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
      } else if (data.type === "error") {
        alert(data.message);
        setWsError(data.message);
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
    setPlayerList([{ username, leader: true }]);
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

  return (
    <div className="App">
      {wsError && <h1>{wsError}</h1>}

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

      {room && !wsError && !gameStarted && (
        <>
          <h1>Room {room}</h1>
          <h3>Players</h3>
          <ul>
            {playerList.map((player: player, index: number) => (
              <li key={index}>
                {player.leader ? "👑" : ""}
                {player.username}
              </li>
            ))}
          </ul>
          <h3>Chat</h3>
          <ul>
            {messages.map((message: message, index: number) => (
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

          {createdRoom && (
            <button
              style={{ width: "100%", marginTop: 25 }}
              onClick={startGame}
            >
              Start Game
            </button>
          )}
        </>
      )}

      {room && gameStarted && !wsError && (
        <div>
          <h2>Game Board</h2>
          <div className="game-board">
            {board.map((row, rowIndex) => (
              <div key={rowIndex} className="board-row">
                {row.map((cell, columnIndex) => (
                  <div key={columnIndex} className="board-cell">
                    <span>{cell}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
