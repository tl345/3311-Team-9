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
                } else {
                    setPlayers([]);
                }
            } catch (error) {
                console.error(`Failed to fetch players for ${teamName}:`, error);
            }
            setLoading(false);
        };

        fetchPlayers();
    }, [sport, teamName]);

    if (loading) return <p>Loading players...</p>;

    return (
        <div className="team-page">
            <h1>{teamName} - {sport}</h1>
            <Link to="/">← Back to Home</Link>

            {players.length > 0 ? (
                <ul>
                    {players.map((player) => (
                        <li key={player.id} className="player-item">
                            <Link to={`/player/${player.id}`} className="player-name">{player.name}</Link>
                            {" - "}
                            <span>{player.position || 'N/A'}</span>
                            {" - #"}
                            <span>{player.number !== "N/A" ? player.number : "N/A"}</span>
                            {" - Goals: "}
                            <span>{player.goals ?? 0}</span>
                            {" - Appearances: "}
                            <span>{player.appearances !== "N/A" ? player.appearances : "N/A"}</span>
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
