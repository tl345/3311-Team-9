function PlayerList({ players, type }) {
    return (
        <ol>
            {players.map((player, index) => (
                <li key={index}>
                    {type === 'EPL'
                        ? `${player.name} – ${player.team} (${player.goals} goals)`
                        : `${player.name} – ${player.team || ''}`}
                </li>
            ))}
        </ol>
    );
}

export default PlayerList;
