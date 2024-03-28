import { useState } from "react";
import { toast } from "react-toastify";

interface Message {
  username?: string;
  text: string;
}

interface MessageForm {
  ws: WebSocket;
  roomCode: string;
  username: string;
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

export default function MessageForm({
  ws,
  roomCode,
  username,
  setMessages,
}: MessageForm) {
  const [message, setMessage] = useState<string>("");

  const sendMessage = () => {
    if (message.trim() == "") {
      toast.error("Please enter message");
      return;
    }

    ws.send(
      JSON.stringify({
        type: "message",
        text: message,
        room: roomCode,
      })
    );
    setMessages((prevMessages) => [
      ...prevMessages,
      { username: username, text: message },
    ]);
    setMessage("");
  };

  return (
    <form className="messageContainer" onSubmit={(e) => e.preventDefault()}>
      <input
        type="text"
        placeholder="Enter your message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />
      <button className="send" onClick={sendMessage}>
        <span>✉️</span> <span>Send</span>
      </button>
    </form>
  );
}
