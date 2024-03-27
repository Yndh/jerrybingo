
interface TopThree {
    username: string;
    bingo: boolean;
    bingoTimestamp?: number;
    gameTimestamp?: number;
    checkedCells: number;
  }

interface Summary {
    leaderboard: TopThree[]
    calculateTimeDifference: (startTime: number, endTime: number) => string;
}

export default function Summary({ leaderboard, calculateTimeDifference }: Summary){
    return (
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
    )
}