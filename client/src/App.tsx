// App.tsx
import React, { useState, useEffect } from "react";
import "./App.css";

const ws = new WebSocket("ws://localhost:8080");

interface message {
  username?: string;
  text: string;
}

const App: React.FC = () => {
  const [wsError, setWsError] = useState<string>("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<message[]>([]);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [room, setRoom] = useState("");

  const [createdRoom, setCreatedRoom] = useState<boolean>(false);

  useEffect(() => {
    ws.onopen = () => {
      setWsError(false);
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
      } else if (data.type === "roomCode") {
        setRoom(data.roomCode);
        setMessages([]);
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

      {room && !wsError && (
        <>
          <h1>Room {room}</h1>
          <h3>Players</h3>
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
        </>
      )}
    </div>
  );
};

export default App;
