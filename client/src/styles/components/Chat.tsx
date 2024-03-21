import { useRef, useEffect } from "react";

interface Message {
  username?: string;
  text: string;
}

interface ChatProps {
  messages: Message[];
}

export default function Chat({ messages }: ChatProps) {
  const chatContainerRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="container chat">
      <h3>💬 Chat</h3>
      <ul className="chat" ref={chatContainerRef}>
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
  );
}
