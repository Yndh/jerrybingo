interface MessageForm {
    message: string;
    setMessage: React.Dispatch<React.SetStateAction<string>>
    sendMessage: () => void;
}

export default function MessageForm({ message, setMessage, sendMessage}: MessageForm){
    return(
        <form
            className="messageContainer"
            onSubmit={(e) => e.preventDefault()}
          >
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
    )
}