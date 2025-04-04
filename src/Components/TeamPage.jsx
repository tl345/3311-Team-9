/**
 * TeamPage Component
 * 
 * This component displays the roster for a specific team in any supported sport (NBA, NFL, EPL).
 * It handles:
 * - Dynamic loading of players based on the team name and sport from URL parameters
 * - Sport-specific player information display (different stats shown for different sports)
 * - Navigation back to the homepage
 * 
 * The component fetches data using sport-specific API functions and presents
 * the data in a consistent format regardless of sport type.
 */
import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getNbaPlayersByTeam, getEplPlayersByTeam, getNflPlayersByTeam, getNbaTeams, getEplTeams, getNflTeams } from "../api";
import "./TeamPage.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png";

function TeamPage() {
  const { sport, teamName } = useParams();
  const location = useLocation(); // Detects navigation change

  // ✅ State for players and team logo
  const [players, setPlayers] = useState([]);
  const [teamLogo, setTeamLogo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        let fetchedPlayers = [];
        let fetchedTeams = [];

        if (sport === "NBA") {
          fetchedPlayers = await getNbaPlayersByTeam(teamName);
          fetchedTeams = await getNbaTeams();
        } else if (sport === "Premier League") {
          fetchedPlayers = await getEplPlayersByTeam(teamName);
          fetchedTeams = await getEplTeams();
        } else if (sport === "NFL") {
          fetchedPlayers = await getNflPlayersByTeam(teamName);
          fetchedTeams = await getNflTeams();
        }

        setPlayers(fetchedPlayers);

        // ✅ Find the team logo
        const teamData = fetchedTeams.find(team => team.name.toLowerCase() === teamName.toLowerCase());
        if (teamData && teamData.logo) {
          setTeamLogo(teamData.logo);
        }
      } catch (error) {
        console.error(`Failed to fetch players for ${teamName}:`, error);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [sport, teamName, location.pathname]); // ✅ Re-fetch when navigating back

  if (loading) return <div>Loading players...</div>;

  if (!players.length) return <div>No players found for this team.</div>;

  return (
    <div className="team-container">
      <div className="team-box">
        <div className="league-header">
          {sport === "NBA" && <img src={nbaLogo} alt="NBA Logo" className="league-logo" />}
          {sport === "NFL" && <img src={nflLogo} alt="NFL Logo" className="league-logo" />}
          {sport === "Premier League" && <img src={premLogo} alt="Premier League Logo" className="league-logo" />}
          <h2 className="league-name">{sport}</h2>
        </div>

        <div className="team-header">
          {teamLogo && <img src={teamLogo} alt={`${teamName} Logo`} className="team-logo" />}
          <h1>{teamName}</h1>
        </div>

        <Link to="/" className="back-link">← Back to Home</Link>
        
        <div className="player-list">
        {players.map(player => (
          <Link to={`/player/${player.id}`} key={player.id} className="player-card">
            {sport === "NBA" && (
              <div>
                <p>{player.name} - {player.position} - #{player.number}</p>
              </div>
            )}
            {sport === "Premier League" && (
              <div>
                <p>{player.name} - {player.position} - Goals: {player.goals || 0} - Appearances: {player.appearances}</p>
              </div>
            )}
            {sport === "NFL" && (
              <div>
                <p>{player.name} - {player.position} - #{player.number}</p>
              </div>
            )}
          </Link>
        ))}
        </div>
      </div>
    </div>
  );
}

export default TeamPage;

