/**
 * PlayerPage Component
 * 
 * This component displays detailed statistics for an individual player.
 * It handles different sports with sport-specific stat displays:
 * - NBA: Points, assists, rebounds, blocks, steals
 * - NFL: Touchdowns, yards
 * - EPL: Goals, assists, cards, etc.
 * 
 * The component fetches player data based on the ID from the URL
 * and adapts its display based on the player's sport.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerDetails } from '../api';

function PlayerPage() {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Effect to fetch player details when component mounts or when the player ID in the URL changes
   */
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      setLoading(true);
      try {
        const data = await getPlayerDetails(id);
        setPlayer(data);
      } catch (error) {
        console.error('Failed to fetch player details:', error);
      }
      setLoading(false);
    };

    fetchPlayerDetails();
  }, [id]);

  // Shows loading state while fetching player data
  if (loading) return <div>Loading player details...</div>;

  // Show error message if player is not found
  if (!player) return <div>Player not found.</div>;

  // Render player details with sport-specific stats
  return (
    <div className="player-details">
      <h1>{player.name}</h1>
      <Link to="/" className="back-link">← Back to Home</Link>
      
      <div className="player-info">
        {/* Common player information */}
        <p>Nationality: {player.nationality || "N/A"}</p>
        <p>Age: {player.age || "N/A"}</p>
        <p>Date of Birth: {player.birth || "N/A"}</p>
        <p>Height: {player.height || "N/A"}</p>
        <p>Weight: {player.weight || "N/A"}</p>
        <p>Appearances: {player.appearances || "N/A"}</p>
        
        {/* Sport-specific stats */}
        {player.league === 'NBA' && (
          <div className="nba-stats">
            <h3>Stats</h3>
            <p>Points: {player.points || 0}</p>
            <p>Assists: {player.assists || 0}</p>
            <p>Rebounds: {player.rebounds || 0}</p>
            <p>Blocks: {player.blocks || 0}</p>
            <p>Steals: {player.steals || 0}</p>
          </div>
        )}
        
        {player.league === 'NFL' && (
          <div className="nfl-stats">
            <h3>Stats</h3>
            <p>Touchdowns: {player.touchdowns || 0}</p>
            <p>Yards: {player.yards || 0}</p>
          </div>
        )}
        
        {player.league === 'EPL' && (
          <div className="epl-stats">
            <h3>Stats</h3>
            <p>Goals: {player.goals || 0}</p>
            <p>Assists: {player.assists || 0}</p>
            <p>Yellow Cards: {player.yellowCards || 0}</p>
            <p>Red Cards: {player.redCards || 0}</p>
            <p>Key Passes: {player.keyPasses || 0}</p>
            <p>Pass Accuracy: {player.passAccuracy || "N/A"}</p>
            <p>Penalty Goals: {player.penaltyGoals || 0}</p>
            <p>Tackles: {player.tackles || 0}</p>
            <p>Goal Saves: {player.goalSaves || 0}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PlayerPage;
