import React, { useState, useEffect } from "react";
import "./styles/App.scss";
import { ToastContainer, toast } from "react-toastify";

const ws = new WebSocket("ws://localhost:8080");

interface Message {
  username?: string;
  text: string;
}

interface Player {
  id: string;
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
  const [creatingRoom, setCreatingRoom] = useState<boolean>(false);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);

  //Room
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [room, setRoom] = useState<string>("");
  const [createdRoom, setCreatedRoom] = useState<boolean>(false);
  const [playerList, setPlayerList] = useState<Player[]>([]);
  const [userToKick, setUserToKick] = useState<string>("");
  const [clientIdToKick, setClientIdToKick] = useState<string>("");

  //Game
  const [board, setBoard] = useState<Cell[][]>([]);
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [sideBarOpen, setSideBarOpen] = useState<boolean>(false);
  const [bingo, setBingo] = useState<boolean>(false);

  // Overview
  const [overview, setOverview] = useState<boolean>(false);
  const [leaderboard, setLeaderboard] = useState<TopThree[]>([]);

  // Other
  const [clientId, setClientId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    ws.onopen = () => {
      setWsError("");
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      console.table(data);
      console.table(data.playerList);

      if (data.type === "message") {
        setMessages((prevMessages) => [
          ...prevMessages,
          { username: data.username, text: data.text },
        ]);
        setPlayerList(data.playerList);
      } else if (data.type === "permission") {
        setCreatedRoom(true);
        setMessages((prevMessages) => [
          ...prevMessages,
          { username: username, text: data.text },
        ]);
        setPlayerList(data.playerList);
      } else if (data.type === "roomCode") {
        setRoom(data.roomCode);
        setMessages([]);
        setPlayerList(data.playerList);
        setClientId(data.clientId);
      } else if (data.type === "gameStarted") {
        setBoard(data.board);
        setGameStarted(true);
        setOverview(false);
      } else if (data.type === "board") {
        setBoard(data.board);
      } else if (data.type === "bingo") {
        setBoard(data.board);
        setBingo(true);
        toast.success("BINGO!");
      } else if (data.type === "check") {
        setPlayerList(data.playerList);
      } else if (data.type === "gameEnded") {
        setBoard([]);
        setBingo(false);
        setGameStarted(false);
        setLeaderboard(data.leaderboard);
        setPlayerList(data.playerList);
        setOverview(true);
      } else if (data.type === "leave") {
        reset();
      } else if (data.type === "error") {
        toast.error(data.message);
        setMessages([]);
      }
    };

    ws.onclose = () => {
      setWsError("You have been disconnected");
      reset();
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

  const leaveRoom = () => {
    ws.send(
      JSON.stringify({
        type: "leave",
        room: room,
      })
    );
  };

  const kickFromRoom = (clientId: string, username: string) => {
    setModalOpen(true);
    setUserToKick(username);
    setClientIdToKick(clientId);
  };

  const kickUser = () => {
    ws.send(
      JSON.stringify({
        type: "kick",
        room: room,
        clientId: clientIdToKick,
      })
    );
    setModalOpen(false);
  };

  const reset = () => {
    setCreatedRoom(false);
    setRoom("");
    setMessages([]);
    setMessage("");
    setBoard([]);
    setGameStarted(false);
    setBingo(false);
    setCreatingRoom(false);
    setJoiningRoom(true);
    setLeaderboard([]);
    setOverview(false);
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

  const switchToCreatingRoom = () => {
    setJoiningRoom(false);
    setCreatingRoom(true);
  };

  const switchToJoingRoom = () => {
    setCreatingRoom(false);
    setJoiningRoom(true);
  };

  const backToMain = () => {
    setCreatingRoom(false);
    setJoiningRoom(false);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="App">
      {/* Error */}
      {wsError && (
        <div className="mainContainer">
          <h1>{wsError}</h1>
          <button onClick={refreshPage}>🔁 Refresh</button>
        </div>
      )}

      {/* Main Page */}
      {!room && !joiningRoom && !creatingRoom && !wsError && (
        <div className="mainContainer">
          <h1>Jerrdle</h1>
          <div className="inputContainer">
            <button onClick={switchToJoingRoom}>🎮 Join Room</button>
            <button onClick={switchToCreatingRoom}>🔨 Create Room</button>
          </div>
        </div>
      )}

      {/* Joining Room */}
      {!room && joiningRoom && !creatingRoom && !wsError && (
        <div className="mainContainer">
          <h1>Join room</h1>
          <div className="inputContainer">
            <input
              type="text"
              id="usernameInput"
              placeholder="Enter your nickname"
              maxLength={10}
              onChange={(e) => {
                if (e.target.value.length <= 10) setUsername(e.target.value);
              }}
            />

            <input
              type="text"
              id="roomCode"
              placeholder="Enter room code"
              onChange={(e) => setRoomCode(e.target.value)}
            />
          </div>
          <div className="inputContainer">
            <button
              onClick={joinRoom}
              disabled={!(roomCode.trim() !== "" && username.trim() !== "")}
            >
              🚪 Join Room
            </button>
            <button onClick={backToMain}>⬅️ Go Back</button>
          </div>
        </div>
      )}

      {/* Creating Room */}
      {!room && !joiningRoom && creatingRoom && !wsError && (
        <div className="mainContainer">
          <h1>New room</h1>
          <input
            type="text"
            id="usernameInput"
            placeholder="Enter your nickname"
            onChange={(e) => setUsername(e.target.value)}
          />
          <div className="inputContainer">
            <button onClick={createRoom} disabled={username.trim() == ""}>
              🔨 Create Room
            </button>
            <button onClick={backToMain}>⬅️ Go Back</button>
          </div>
        </div>
      )}

      {/* Lobby */}
      {room && !wsError && !gameStarted && !overview && (
        <div className="roomContainer">
          <h1>
            Room <span className="code">#{room}</span>
          </h1>
          <div className="container players">
            <h3>👥 Players</h3>
            <ul className="player">
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
                    {player.leader ? "👑" : "👤"}
                    <span
                      className={
                        createdRoom
                          ? `username ${player.leader ? "leader" : ""}`
                          : ""
                      }
                      onClick={() =>
                        createdRoom
                          ? player.leader
                            ? ""
                            : kickFromRoom(player.id, player.username)
                          : ""
                      }
                    >
                      {player.username + " "}
                      <b>{" [Game]"}</b>
                    </span>
                  </li>
                ))}
              {playerList
                .filter((player: Player) => !player.inGame)
                .map((player: Player, index: number) => (
                  <li key={index}>
                    {player.leader ? "👑" : "👤"}
                    <span
                      className={
                        createdRoom
                          ? `username ${player.leader ? "leader" : ""}`
                          : ""
                      }
                      onClick={() =>
                        createdRoom
                          ? player.leader
                            ? ""
                            : kickFromRoom(player.id, player.username)
                          : ""
                      }
                    >
                      {player.username}
                    </span>
                  </li>
                ))}
            </ul>
          </div>
          <div className="container chat">
            <h3>💬 Chat</h3>
            <ul className="chat">
              {messages.map((message: Message, index: number) => (
                <li key={index}>
                  <span className="username">
                    {message.username ? `[${message.username}]: ` : ""}{" "}
                  </span>
                  <span className="message">{message.text}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="messageContainer">
            <input
              type="text"
              placeholder="Enter your message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button onClick={sendMessage}>✉️ Send</button>
          </div>

          <div className="inputContainer">
            {createdRoom && (
              <button
                style={{ width: "100%", marginTop: 25 }}
                onClick={startGame}
              >
                🎮 Start Game
              </button>
            )}

            <button onClick={leaveRoom}>🚪 Leave Room</button>
          </div>
        </div>
      )}

      {/* Game */}
      {room && gameStarted && !wsError && !overview && (
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
              <ul className="player">
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
                      {player.leader ? "👑" : "👤"}
                      <span
                        className={
                          createdRoom
                            ? `username ${player.leader ? "leader" : ""}`
                            : ""
                        }
                        onClick={() =>
                          createdRoom
                            ? player.leader
                              ? ""
                              : kickFromRoom(player.id, player.username)
                            : ""
                        }
                      >
                        {player.username + " "}

                        <b>{player.checkedCells}/25</b>
                      </span>
                    </li>
                  ))}
                {playerList
                  .filter((player: Player) => !player.inGame)
                  .map((player: Player, index: number) => (
                    <li key={index}>
                      {player.leader ? "👑" : "👤"}
                      <span
                        className={
                          createdRoom
                            ? `username ${player.leader ? "leader" : ""}`
                            : ""
                        }
                        onClick={() =>
                          createdRoom
                            ? player.leader
                              ? ""
                              : kickFromRoom(player.id, player.username)
                            : ""
                        }
                      >
                        {player.username}
                        <b>{" [Lobby] "}</b>
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
            <div className="container chat">
              <h3>💬 Chat</h3>
              <ul className="chat">
                {messages.map((message: Message, index: number) => (
                  <li key={index}>
                    <span className="username">
                      {message.username ? `[${message.username}]: ` : ""}{" "}
                    </span>
                    <span className="message">{message.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="messageContainer">
              <input
                type="text"
                placeholder="Enter your message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <button onClick={sendMessage}>✉️ Send</button>
            </div>

            <div className="inputContainer">
              {createdRoom && <button onClick={endGame}>⛔ End game</button>}
              <button onClick={leaveRoom}>🚪 Leave room</button>
            </div>
          </div>
        </div>
      )}

      {/* Overview */}
      {room && overview && !wsError && !gameStarted && (
        <div className="overviewContainer">
          <h1>Summary</h1>
          <ol>
            {leaderboard.map((player: TopThree, index: number) => (
              <li key={index}>
                <h1>
                  {index + 1 == 1 ? "🏆" : index + 1 == 2 ? "🥈" : "🥉"}#
                  {index + 1} {player.username}
                </h1>
                {player.bingo && <p>🟦 BINGO!</p>}
                <p>🔢 {player.checkedCells}/25</p>
                {player.bingoTimestamp && player.gameTimestamp && (
                  <p>
                    🕧{" "}
                    {calculateTimeDifference(
                      player.gameTimestamp,
                      player.bingoTimestamp
                    )}
                  </p>
                )}
              </li>
            ))}
          </ol>
          <button onClick={goToLobby}>🎮 Play again</button>
        </div>
      )}

      {modalOpen && (
        <div className="modalContainer">
          <div className="modal">
            <h1>
              Are you sure you want to kick 👤 {userToKick} from the room?
            </h1>
            <div className="buttons">
              <button onClick={() => setModalOpen(false)}>❌ Cancel</button>
              <button onClick={kickUser}>🥾 Kick User</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
