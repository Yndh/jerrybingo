interface ModalProps {
  ws: WebSocket;
  roomCode: string;
  userToKick: string;
  clientIdToKick: string;
  setModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Modal({
  ws,
  roomCode,
  clientIdToKick,
  userToKick,
  setModalOpen,
}: ModalProps) {
  const kickUser = () => {
    ws.send(
      JSON.stringify({
        type: "kick",
        room: roomCode,
        clientId: clientIdToKick,
      })
    );
    setModalOpen(false);
  };

  return (
    <div className="modalContainer">
      <div className="modal">
        <h1>Are you sure you want to kick 👤 {userToKick} from the room?</h1>
        <div className="buttons">
          <button onClick={kickUser}>🥾 Kick User</button>
          <button onClick={() => setModalOpen(false)}>❌ Cancel</button>
        </div>
      </div>
    </div>
  );
}
