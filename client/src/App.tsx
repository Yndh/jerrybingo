import { useCallback, useState } from "react";
import "./App.css";

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [responseHistory, setResponseHistory] = useState<string[]>([]);
  const [message, setMessage] = useState<string>("");

  const connect = useCallback(() => {
    const newWs = new WebSocket("ws://localhost:8080");

    newWs.onopen = () => {
      alert("Connected");
      console.log("Connected to server");
    };

    newWs.onmessage = (event) => {
      const response = event.data;
      setResponseHistory((prevHistory) => [
        ...prevHistory,
        `[sever]: ${response}`,
      ]);
    };

    newWs.onclose = () => {
      alert("Disconnected");
      console.log("Disconnected from server");
      setWs(null);
    };

    setWs(newWs);
  }, []);

  const disconnect = useCallback(() => {
    if (ws) {
      ws.close();
    }
  }, [ws]);

  const sendMessage = useCallback(() => {
    if (ws && message.trim()) {
      ws.send(message);
      console.log(`sent "${message.trim()}"`);
      setResponseHistory((prevHistory) => [
        ...prevHistory,
        `[you]: ${message.trim()}`,
      ]);
      setMessage("");
    }
  }, [ws, message]);

  return (
    <>
      <p>Hello</p>
      <div style={{ marginBottom: 15 }}>
        <button onClick={connect}>Connect</button>
        <button onClick={disconnect}>Disconnect</button>
      </div>
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Send message</button>
      <h2>Response History</h2>
      <ul>
        {responseHistory.map((response, index) => (
          <li key={index}>{response}</li>
        ))}
      </ul>
    </>
  );
}

export default App;
