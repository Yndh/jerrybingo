interface CreatingProps {
  ws: WebSocket;
  username: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setCreatedRoom: React.Dispatch<React.SetStateAction<boolean>>;
  setCreatingRoom: React.Dispatch<React.SetStateAction<boolean>>;
  setJoiningRoom: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Creating({
  ws,
  username,
  setUsername,
  setCreatedRoom,
  setCreatingRoom,
  setJoiningRoom,
}: CreatingProps) {
  const createRoom = () => {
    setCreatedRoom(true);
    ws.send(JSON.stringify({ type: "join", username: username }));
  };

  const backToMain = () => {
    setCreatingRoom(false);
    setJoiningRoom(false);
  };

  return (
    <div className="mainContainer">
      <h1>New room</h1>
      <input
        type="text"
        id="usernameInput"
        placeholder="Enter your nickname"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <div className="inputContainer">
        <button onClick={createRoom} disabled={username.trim() == ""}>
          🔨 Create Room
        </button>
        <button onClick={backToMain}>⬅️ Go Back</button>
      </div>
    </div>
  );
}
