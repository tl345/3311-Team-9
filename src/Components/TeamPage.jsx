import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getNbaPlayersByTeam, getEplPlayersByTeam } from "../api";
import "./TeamPage.css";

function TeamPage() {
    const { sport, teamName } = useParams();
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPlayers = async () => {
            setLoading(true);
            try {
                if (sport === "NBA") {
                    const nbaPlayers = await getNbaPlayersByTeam(teamName);
                    setPlayers(nbaPlayers);
                } else if (sport === "Premier League") {
                    const eplPlayers = await getEplPlayersByTeam(teamName);
                    setPlayers(eplPlayers);
                } else if (sport === "NFL") {
                    setPlayers([]); // No detailed NFL data for now
                }
            } catch (error) {
                console.error(`Failed to fetch players for ${teamName}:`, error);
            }
            setLoading(false);
        };

        fetchPlayers();
    }, [sport, teamName]);

    if (loading) return <p>Loading players...</p>;

    if (sport === "NFL") {
        return (
            <div className="team-page">
                <h1>{teamName} - {sport}</h1>
                <p>Player data for NFL teams is not available yet.</p>
                <Link to="/">← Back to Home</Link>
            </div>
        );
    }

    return (
        <div className="team-page">
            <h1>{teamName} - {sport}</h1>
            <Link to="/">← Back to Home</Link>

            {players.length > 0 ? (
                <ul>
                    {players.map((player) => (
                        <li key={player.id}>
                            <Link to={`/player/${player.id}`}>{player.name}</Link>
                            {` - #${player.number || "N/A"} - ${player.position || "N/A"} - Appearances: ${player.appearances || 0} - Goals: ${player.goals || 0}`}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No players found for this team.</p>
            )}
        </div>
    );
}

export default TeamPage;
