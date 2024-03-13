// App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";

const ws = new WebSocket("ws://localhost:8080");

const App: React.FC = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState("");

  const [createdRoom, setCreatedRoom] = useState<boolean>(false);

  useEffect(() => {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.log(data);

      if (data.type === "message") {
        setMessages((prevMessages) => [...prevMessages, data.text]);
      } else if (data.type === "roomCode") {
        setRoom(data.roomCode);
        setMessages([]);
      } else if (data.type === "error") {
        alert(data.message);
      }
    };

    ws.onclose = () => {
      alert("Closed connection");
    };
  }, []);

  const createRoom = () => {
    setCreatedRoom(true);
    ws.send(JSON.stringify({ type: "join", username: username }));
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

  return (
    <div className="App">
      {!room && (
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

      {room && <h1>Room {room}</h1>}
    </div>
  );
};

export default App;
