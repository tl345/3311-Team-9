/**
 * StandingsPage Component
 * 
 * This component displays all teams for a specific sports league:
 * - NBA: Teams displayed in alphabetical order
 * - NFL: Teams displayed in order of win percentage
 * - Premier League: Teams displayed in rank order with position numbers
 * 
 * The component fetches data from sport-specific API endpoints and
 * provides navigation links to individual team pages.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getNbaTeams, getNflTeams, getEplTeams } from "../api";
import "./StandingsPage.css";

function StandingsPage() {
    // Extract league parameter from URL
    const { league } = useParams();

    // State for teams data and loading status
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);

    /**
     * Effect hook to fetch teams data when component mounts or league changes
     * Uses different API functions based on the league parameter
     */
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
    }, [league]); // Re-fetch when league changes

    if (loading) return <p>Loading teams...</p>;

    return (
        <div className="standings-box">
          <h1 className="standings-title">{league} Standings</h1>
          <ul className="standings-list">
            {teams.map((team, index) => (
              <li key={team.name}>
                {league === "Premier League" && <strong>{index + 1}. </strong>}
                {team.logo && (
                  <img
                    src={team.logo}
                    alt={team.name}
                    style={{ width: "30px", height: "30px", marginRight: "10px" }}
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
