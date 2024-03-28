interface MainProps {
  setCreatingRoom: React.Dispatch<React.SetStateAction<boolean>>;
  setJoiningRoom: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Main({ setCreatingRoom, setJoiningRoom }: MainProps) {
  const switchToCreatingRoom = () => {
    setJoiningRoom(false);
    setCreatingRoom(true);
  };

  const switchToJoingRoom = () => {
    setCreatingRoom(false);
    setJoiningRoom(true);
  };

  return (
    <div className="mainContainer">
      <h1>Jerrdle</h1>
      <div className="inputContainer">
        <button onClick={switchToJoingRoom}>🎮 Join Room</button>
        <button onClick={switchToCreatingRoom}>🔨 Create Room</button>
      </div>
    </div>
  );
}
