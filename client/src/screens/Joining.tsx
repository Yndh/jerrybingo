import { toast } from "react-toastify";

interface JoiningProps {
  ws: WebSocket;
  username: string;
  roomCode: string;
  setRoomCode: React.Dispatch<React.SetStateAction<string>>;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setCreatedRoom: React.Dispatch<React.SetStateAction<boolean>>;
  setCreatingRoom: React.Dispatch<React.SetStateAction<boolean>>;
  setJoiningRoom: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Joining({
  ws,
  username,
  roomCode,
  setUsername,
  setRoomCode,
  setCreatingRoom,
  setJoiningRoom,
}: JoiningProps) {
  const joinRoom = (gameCode: string) => {
    if (gameCode.trim() == "") {
      toast.error("Please enter a room code");
      return;
    }
    ws.send(
      JSON.stringify({ type: "join", username: username, room: gameCode })
    );
  };

  const backToMain = () => {
    setCreatingRoom(false);
    setJoiningRoom(false);
  };

  return (
    <div className="mainContainer">
      <h1>Join room</h1>
      <div className="inputContainer">
        <input
          type="text"
          id="usernameInput"
          placeholder="Enter your nickname"
          maxLength={13}
          value={username}
          onChange={(e) => {
            if (e.target.value.length <= 13) setUsername(e.target.value);
          }}
        />

        <input
          type="number"
          id="roomCode"
          placeholder="Enter room code"
          maxLength={5}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
      </div>
      <div className="inputContainer">
        <button
          onClick={() => joinRoom(roomCode)}
          disabled={!(roomCode.trim() !== "" && username.trim() !== "")}
        >
          🚪 Join Room
        </button>
        <button onClick={backToMain}>⬅️ Go Back</button>
      </div>
    </div>
  );
}
