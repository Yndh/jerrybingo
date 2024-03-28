import Chat from "../styles/components/Chat";
import MessageForm from "../styles/components/MessageForm";
import PlayerList from "../styles/components/PlayerList";

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

interface Cell {
  value: string;
  checked: boolean;
}

interface GameProps {
  ws: WebSocket;
  roomCode: string;
  username: string;
  createdRoom: boolean;
  messages: Message[];
  playerList: Player[];
  board: Cell[][];
  sideBarOpen: boolean;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setUserToKick: React.Dispatch<React.SetStateAction<string>>;
  setClientIdToKick: React.Dispatch<React.SetStateAction<string>>;
  setSideBarOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Game({
  ws,
  roomCode,
  username,
  playerList,
  createdRoom,
  messages,
  board,
  sideBarOpen,
  setMessages,
  setModalOpen,
  setUserToKick,
  setClientIdToKick,
  setSideBarOpen,
}: GameProps) {
  const makeMove = (x: number, y: number) => {
    ws.send(
      JSON.stringify({
        type: "move",
        room: roomCode,
        value: { x, y },
      })
    );
  };

  const endGame = () => {
    ws.send(
      JSON.stringify({
        type: "end",
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
    <div className="gameContainer">
      <div className="game">
        <h2>🔢 Bingo</h2>
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

      <button
        className="menuButton"
        onClick={() => setSideBarOpen(!sideBarOpen)}
      >
        {sideBarOpen ? "❌" : "💬"}
      </button>
      <div className={`sidebar ${sideBarOpen ? "open" : ""}`}>
        <div className="container players">
          <h3>👥 Players</h3>
          <PlayerList
            playerList={playerList}
            createdRoom={createdRoom}
            game={true}
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
          {createdRoom && <button onClick={endGame}>⛔ End game</button>}
          <button onClick={leaveRoom}>🚪 Leave room</button>
        </div>
      </div>
    </div>
  );
}
