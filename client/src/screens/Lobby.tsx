import { toast } from "react-toastify";
import Chat from "../components/Chat";
import MessageForm from "../components/MessageForm";
import PlayerList from "../components/PlayerList";
import { URL } from "../components/Url";

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

  const copyUrl = () => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard
        .writeText(`${URL}?gameCode=${roomCode}`)
        .then(() => {
          toast.success("Link copied to clipboard successfully");
        })
        .catch(() => {
          toast.error("Oops! Unable to copy the link. Please try again.");
        });
    }
  };

  const shareHandler = () => {
    if (navigator && navigator.share) {
      navigator
        .share({
          title: "Jerrdle Game Invite",
          text: "Join my room in Jerrdle!",
          url: `${URL}?gameCode=${roomCode}`,
        })
        .catch(() =>
          toast.error(`Oops! Unable share the link. Please try again.`)
        );
    } else {
      toast.error(`Oops! Unable share the link. Please try again.`);
    }
  };

  return (
    <div className="roomContainer">
      <div className="container link">
        <h3>Room #{roomCode}</h3>
        {/* <p>Invite others to join the lobby by sharing the link</p> */}
        <div className="container url" onClick={copyUrl}>
          <span>
            {URL}?gameCode={roomCode}
          </span>
        </div>
        <div className="buttons">
          <button onClick={copyUrl}>📋 Copy Link</button>
          <button onClick={shareHandler}>🔗</button>
        </div>
      </div>
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
