interface Player {
    id: string;
    username: string;
    leader: boolean;
    inGame: boolean;
    checkedCells?: number;
    bingo?: boolean;
  }

interface PlayerList {
    playerList: Player[];
    createdRoom: boolean;
    game?: boolean
    kickFromRoom: (clientId: string, username: string) => void;
}

export default function PlayerList({ playerList, createdRoom, kickFromRoom, game = false }: PlayerList) {
    return (
        <ul className="player">
            {playerList
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
                            {player.username}
                            {game && player.inGame && <b>{" "}{player.checkedCells}/25</b>}
                            {player.inGame && <b>{" [Game]"}</b>}
                            {game && !player.inGame && <b>{" [Lobby]"}</b>}
                            {player.bingo && player.inGame && <b>{" [BINGO]"}</b>}
                        </span>
                    </li>
                ))}
        </ul>

    )
}