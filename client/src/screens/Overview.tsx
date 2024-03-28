import Summary from "../styles/components/Summary";

interface TopThree {
  username: string;
  bingo: boolean;
  bingoTimestamp?: number;
  gameTimestamp?: number;
  checkedCells: number;
}

interface OverviewProps {
  leaderboard: TopThree[];
  setOverview: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Overview({ leaderboard, setOverview }: OverviewProps) {
  const calculateTimeDifference = (
    startTime: number,
    endTime: number
  ): string => {
    const start = new Date(startTime).getTime();
    const end = new Date(endTime).getTime();
    const timeDiff = Math.abs(end - start);

    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);

    const formattedMinutes = minutes < 10 ? `0${minutes}` : `${minutes}`;
    const formattedSeconds = seconds < 10 ? `0${seconds}` : `${seconds}`;

    return `${hours}:${formattedMinutes}:${formattedSeconds}`;
  };

  const goToLobby = () => {
    setOverview(false);
  };

  return (
    <div className="overviewContainer">
      <h1>Summary</h1>
      <Summary
        leaderboard={leaderboard}
        calculateTimeDifference={calculateTimeDifference}
      />
      <button onClick={goToLobby}>🎮 Play again</button>
    </div>
  );
}
