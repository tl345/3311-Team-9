import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getNbaPlayersByTeam, getEplPlayersByTeam } from '../api';
import './TeamPage.css';

function TeamPage() {
    const { sport, teamName } = useParams();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                if (sport === 'NBA') {
                    const nbaPlayers = await getNbaPlayersByTeam(teamName);
                    setPlayers(nbaPlayers);
                } else if (sport === 'Premier League') {
                    const eplPlayers = await getEplPlayersByTeam(teamName);
                    setPlayers(eplPlayers);
                } else {
                    setPlayers([]); // NFL or other sports in the future
                }
            } catch (error) {
                console.error('Failed to fetch players:', error);
            }
            setLoading(false);
        };

        fetchPlayers();
    }, [sport, teamName]);

    return (
        <div className="team-page">
            <h1>{teamName} - {sport}</h1>
            <Link to="/">← Back to Home</Link>
            {loading ? (
                <p>Loading players...</p>
            ) : (
                <>
                    {players.length > 0 ? (
                        <ul>
                            {players.map((player) => (
                                <li key={player.id}>
                                    <Link to={`/player/${player.id}`}>
                                        {player.name}
                                    </Link>
                                    {` - ${player.position || 'N/A'} (${player.number !== 'N/A' && player.number !== null ? `#${player.number}` : 'N/A'})`}

                                    {player.goals !== undefined ? ` - Goals: ${player.goals}` : ''}
                                    {player.appearances !== undefined ? ` - Appearances: ${player.appearances}` : ''}
                                </li>
                            ))}

                        </ul>
                    ) : (
                        <p>No players found.</p>
                    )}
                </>
            )}
        </div>
    );
}

export default TeamPage;
