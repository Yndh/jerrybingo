import Chat from "../components/Chat";
import MessageForm from "../components/MessageForm";
import PlayerList from "../components/PlayerList";

interface Player {
  id: string;
  username: string;
  leader: boolean;
  inGame: boolean;
  checkedCells?: number;
  bingo?: boolean;
}

interface Message {
  username?: string;
  text: string;
}

interface LobbyProps {
  ws: WebSocket;
  roomCode: string;
  username: string;
  createdRoom: boolean;
  messages: Message[];
  playerList: Player[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserToKick: React.Dispatch<React.SetStateAction<string>>;
  setClientIdToKick: React.Dispatch<React.SetStateAction<string>>;
}

export default function Lobby({
  ws,
  roomCode,
  username,
  playerList,
  createdRoom,
  messages,
  setMessages,
  setModalOpen,
  setUserToKick,
  setClientIdToKick,
}: LobbyProps) {
  const startGame = () => {
    ws.send(
      JSON.stringify({
        type: "start",
        room: roomCode,
      })
    );
  };

  const leaveRoom = () => {
    ws.send(
      JSON.stringify({
        type: "leave",
        room: roomCode,
      })
    );
  };

  return (
    <div className="roomContainer">
      <h1>
        Room <span className="code">#{roomCode}</span>
      </h1>
      <div className="container players">
        <h3>👥 Players</h3>
        <PlayerList
          playerList={playerList}
          createdRoom={createdRoom}
          setModalOpen={setModalOpen}
          setUserToKick={setUserToKick}
          setClientIdToKick={setClientIdToKick}
        />
      </div>

      <Chat messages={messages} />
      <MessageForm
        ws={ws}
        roomCode={roomCode}
        setMessages={setMessages}
        username={username}
      />

      <div className="inputContainer">
        {createdRoom && (
          <button style={{ width: "100%", marginTop: 25 }} onClick={startGame}>
            🎮 Start Game
          </button>
        )}

        <button onClick={leaveRoom}>🚪 Leave Room</button>
      </div>
    </div>
  );
}
