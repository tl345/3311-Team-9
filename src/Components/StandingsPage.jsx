import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getNbaTeams, getNflTeams, getEplTeams } from "../api";

function StandingsPage() {
    const { league } = useParams();
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTeams = async () => {
            setLoading(true);
            try {
                if (league === "NBA") {
                    const nbaTeams = await getNbaTeams();
                    setTeams(nbaTeams);
                } else if (league === "NFL") {
                    const nflTeams = await getNflTeams();
                    setTeams(nflTeams);
                } else if (league === "Premier League") {
                    const eplTeams = await getEplTeams();
                    setTeams(eplTeams);
                }
            } catch (error) {
                console.error("Error fetching teams:", error);
            }
            setLoading(false);
        };

        fetchTeams();
    }, [league]);

    if (loading) return <p>Loading teams...</p>;

    return (
        <div>
            <h1>{league} Standings</h1>
            <ul>
                {teams.map((team, index) => (
                    <li key={team.name}>
                        {league === "Premier League" && <strong>{index + 1}. </strong>}
                        {team.logo && (
                            <img
                                src={team.logo}
                                alt={team.name}
                                style={{ width: "25px", height: "25px", marginRight: "10px" }}
                            />
                        )}
                        <Link to={`/team/${league}/${encodeURIComponent(team.name)}`}>
                            {team.name}
                        </Link>
                    </li>
                ))}
            </ul>
            <Link to="/">← Back to Home</Link>
        </div>
    );
}

export default StandingsPage;
