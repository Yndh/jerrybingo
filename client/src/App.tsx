import React, { useState, useEffect, useRef } from "react";
import "./styles/App.scss";
import { toast } from "react-toastify";
import Confetti from "./components/Confetti";
import { useLocation } from "react-router-dom";
import Game from "./screens/Game";
import Lobby from "./screens/Lobby";
import Overview from "./screens/Overview";
import Creating from "./screens/Creating";
import Joining from "./screens/Joining";
import Main from "./screens/Main";
import Modal from "./components/Modal";

const ws = new WebSocket(import.meta.env.VITE_WS_URL);

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
  let location = useLocation();

  const [wsError, setWsError] = useState<string>("");
  const [connected, setConnected] = useState<boolean>(false);
  const pingIntervalRef = useRef<number | null>(null);
  const pongTimeoutRef = useRef<number | null>(null);

  //Lobby
  const [username, setUsername] = useState<string>("");
  const [roomCode, setRoomCode] = useState<string>("");
  const [creatingRoom, setCreatingRoom] = useState<boolean>(false);
  const [joiningRoom, setJoiningRoom] = useState<boolean>(false);

  //Room
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
  const [modalOpen, setModalOpen] = useState<boolean>(false);

  useEffect(() => {
    const pingHandler = () => {
      ws.send(
        JSON.stringify({
          type: "ping",
        })
      );
      pongTimeoutRef.current = setTimeout(() => {
        ws.close();
      }, 10000);
    };

    ws.onopen = () => {
      setWsError("");
      setConnected(true);
      pingIntervalRef.current = setInterval(pingHandler, 180000); // Send ping every 3min
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.table(data);

      if (data.type === "pong") {
        if (pongTimeoutRef.current !== null) {
          clearTimeout(pongTimeoutRef.current);
        }
      } else if (data.type === "message") {
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
      } else if (data.type === "gameStarted") {
        setBoard(data.board);
        setGameStarted(true);
        setOverview(false);
      } else if (data.type === "board") {
        setBoard(data.board);
      } else if (data.type === "bingo") {
        setBoard(data.board);
        setBingo(true);
      } else if (data.type === "check") {
        setPlayerList(data.playerList);
      } else if (data.type === "gameEnded") {
        setBoard([]);
        setBingo(false);
        setGameStarted(false);
        setLeaderboard(data.leaderboard);
        setPlayerList(data.playerList);
        setOverview(true);
        setModalOpen(false);
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

    const query = useQuery();
    const gameCode = query.get("gameCode");
    if (gameCode) {
      toast.info(gameCode);
      setRoomCode(gameCode);
      setJoiningRoom(true);
    }

    return () => {
      clearInterval(pingIntervalRef.current!);
      clearTimeout(pongTimeoutRef.current!);
    };
  }, []);

  const useQuery = () => {
    return new URLSearchParams(location.search);
  };

  const reset = () => {
    setCreatedRoom(false);
    setRoom("");
    setMessages([]);
    setBoard([]);
    setGameStarted(false);
    setBingo(false);
    setCreatingRoom(false);
    setJoiningRoom(true);
    setLeaderboard([]);
    setOverview(false);
  };

  const refreshPage = () => {
    window.location.reload();
  };

  return (
    <div className="App">
      {!connected && !wsError && (
        <div className="loaderContainer">
          <span className="loader">🔢</span>
        </div>
      )}

      {/* Error */}
      {wsError && (
        <div className="mainContainer">
          <h1>{wsError}</h1>
          <button onClick={refreshPage}>🔁 Refresh</button>
        </div>
      )}

      {/* Main Page */}
      {!room && !joiningRoom && !creatingRoom && !wsError && connected && (
        <Main
          setCreatingRoom={setCreatingRoom}
          setJoiningRoom={setJoiningRoom}
        />
      )}

      {/* Joining Room */}
      {!room && joiningRoom && !creatingRoom && !wsError && connected && (
        <Joining
          ws={ws}
          username={username}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          setUsername={setUsername}
          setCreatingRoom={setCreatingRoom}
          setCreatedRoom={setCreatedRoom}
          setJoiningRoom={setJoiningRoom}
        />
      )}

      {/* Creating Room */}
      {!room && !joiningRoom && creatingRoom && !wsError && connected && (
        <Creating
          ws={ws}
          username={username}
          setUsername={setUsername}
          setCreatingRoom={setCreatingRoom}
          setCreatedRoom={setCreatedRoom}
          setJoiningRoom={setJoiningRoom}
        />
      )}

      {/* Lobby */}
      {room && !wsError && !gameStarted && !overview && connected && (
        <Lobby
          ws={ws}
          roomCode={room}
          createdRoom={createdRoom}
          username={username}
          playerList={playerList}
          messages={messages}
          setMessages={setMessages}
          setModalOpen={setModalOpen}
          setUserToKick={setUserToKick}
          setClientIdToKick={setClientIdToKick}
        />
      )}

      {/* Game */}
      {room && gameStarted && !wsError && !overview && connected && (
        <Game
          ws={ws}
          roomCode={room}
          createdRoom={createdRoom}
          username={username}
          playerList={playerList}
          messages={messages}
          setMessages={setMessages}
          setModalOpen={setModalOpen}
          setUserToKick={setUserToKick}
          setClientIdToKick={setClientIdToKick}
          board={board}
          sideBarOpen={sideBarOpen}
          setSideBarOpen={setSideBarOpen}
        />
      )}

      {/* Overview */}
      {room && overview && !wsError && !gameStarted && connected && (
        <Overview leaderboard={leaderboard} setOverview={setOverview} />
      )}

      {bingo && <Confetti />}

      {modalOpen && (
        <Modal
          ws={ws}
          roomCode={room}
          userToKick={userToKick}
          clientIdToKick={clientIdToKick}
          setModalOpen={setModalOpen}
        />
      )}
    </div>
  );
};

export default App;
