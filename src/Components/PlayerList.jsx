/**
 * PlayerList Component
 * 
 * This component renders a list of players with sport-specific data display.
 * It adapts the information shown based on the sport type:
 * 
 * (Jersey number not available yet as we have not found an API with that data)
 * - NBA: Shows player name, position, and jersey number
 * - NFL: Shows player name, position, and jersey number
 * - Premier League (EPL): Shows player name, position, goals, and appearances
 * 
 * Each player is displayed as a clickable card that links to their detailed stats page
 * This component is used in both team pages and search results
 */
import { Link } from "react-router-dom";

/**
 * Renders a list of players with sport-specific information
 * @param {Object} props - Component props
 * @param {Array} props.players - Array of player objects to display
 * @param {string} props.sport - Sport type (NBA, NFL, Premier League)
 * @returns {JSX.Element} The rendered player list or a message if no players
 */
function PlayerList({ players, sport }) {
  if (!players || players.length === 0) {
    return <div>No players found.</div>;
  }

  return (
    <div className="player-list">
      {players.map(player => (
        <Link to={`/player/${player.id}`} key={player.id} className="player-card">
          {/* NBA player display: Name, position, jersey number */}
          {sport === "NBA" && (
            <div>
              <p>{player.name} - {player.position || "N/A"} {player.number && player.number !== "N/A" ? `- #${player.number}` : ""}</p>
            </div>
          )}
          
          {/* Premier League player display: Name, position, goals, appearances */}
          {sport === "Premier League" && (
            <div>
              <p>{player.name} - {player.position || "N/A"} {player.goals !== undefined ? `- Goals: ${player.goals}` : ""} {player.appearances !== undefined ? `- Appearances: ${player.appearances}` : ""}</p>
            </div>
          )}
          
          {/* NFL player display: Name, position, jersey number */}
          {sport === "NFL" && (
            <div>
              <p>{player.name} - {player.position || "N/A"} {player.number && player.number !== "N/A" ? `- #${player.number}` : ""}</p>
            </div>
          )}
        </Link>
      ))}
    </div>
  );
}

export default PlayerList;
