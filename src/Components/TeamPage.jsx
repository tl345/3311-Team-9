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
import { useParams, Link } from "react-router-dom";
import { getNbaPlayersByTeam, getEplPlayersByTeam, getNflPlayersByTeam } from "../api";
import "./TeamPage.css";

function TeamPage() {
  // Extract sport and teamName from the URL
  const { sport, teamName } = useParams();

  // State for players data and loading status
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * Effect hook to fetch players when component mounts or parameters change
   * Uses different API functions based on the sport parameter
   */
  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        // Sport specific API calls to get players for the selected team
        if (sport === "NBA") {
          const nbaPlayers = await getNbaPlayersByTeam(teamName);
          setPlayers(nbaPlayers);
        } else if (sport === "Premier League") {
          const eplPlayers = await getEplPlayersByTeam(teamName);
          setPlayers(eplPlayers);
        } else if (sport === "NFL") {
          const nflPlayers = await getNflPlayersByTeam(teamName);
          setPlayers(nflPlayers);
        } else {
          setPlayers([]);
        }
      } catch (error) {
        console.error(`Failed to fetch players for ${teamName}:`, error);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [sport, teamName]); // Re-fetch when sport or teamName changes

  if (loading) return <div>Loading players...</div>;
  
  if (!players.length) return <div>No players found for this team.</div>;

  return (
    <div className="team-page">
      <h1>{teamName}</h1>
      <Link to="/" className="back-link">← Back to Home</Link>
      
      <div className="player-list">
        {/* Map through players and render differently based on sport */}
        {players.map(player => (
          <Link 
            to={`/player/${player.id}`} 
            key={player.id} 
            className="player-card"
          >
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
  );
}

export default TeamPage;
