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

/**
 * PlayerPage Component
 * 
 * This component displays detailed statistics for an individual player.
 * It handles different sports with sport-specific stat displays:
 * - NBA: Points, assists, rebounds, blocks, steals, team
 * - NFL: Touchdowns, yards, team
 * - EPL: Goals, assists, cards, key passes, tackles, team
 * 
 * The component fetches player data based on the ID from the URL
 * and adapts its display based on the player's sport.
 */

import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPlayerDetails } from '../api';
import NBAScatterChart from './NBAScatterChart';
import './PlayerPage.css';

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
      {/* Player Name & Team */}
      <div className="player-header">
        <h1>{player.name}</h1>
        {player.team && (
          <div className="player-team">
            {player.teamLogo && <img src={player.teamLogo} alt={`${player.team} Logo`} className="team-logo" />}
            <h2>{player.team}</h2>
          </div>
        )}
      </div>

      {/* Player Image */}
      <div className="player-image-container">
        {player.image ? (
          <img src={player.image} alt={player.name} className="player-image" />
        ) : (
          <p className="no-image-text">No image available</p>
        )}
      </div>

      {/* Common Player Information */}
      <div className="player-info">
        <p><strong>Nationality:</strong> {player.nationality || "N/A"}</p>
        <p><strong>Age:</strong> {player.age || "N/A"}</p>
        <p><strong>Date of Birth:</strong> {player.birth || "N/A"}</p>
        <p><strong>Height:</strong> {player.height || "N/A"}</p>
        <p><strong>Weight:</strong> {player.weight || "N/A"}</p>
        <p><strong>Appearances:</strong> {player.appearances || "N/A"}</p>
      </div>

      {/* Sport-specific Stats */}
      {player.league === 'NBA' && (
        <>
          <div className="nba-stats">
            <h3>NBA Stats</h3>
            <p><strong>Points Per Game:</strong> {player.stats?.sportStats?.points || "0"}</p>
            <p><strong>Assists Per Game:</strong> {player.stats?.sportStats?.assists || "0"}</p>
            <p><strong>Rebounds Per Game:</strong> {player.stats?.sportStats?.rebounds || "0"}</p>
            <p><strong>Blocks Per Game:</strong> {player.stats?.sportStats?.blocks || "0"}</p>
            <p><strong>Steals Per Game:</strong> {player.stats?.sportStats?.steals || "0"}</p>
            <p><strong>Games Played:</strong> {player.stats?.gamesPlayed || "0"}</p>
          </div>
          
          {/* Add the scatter plot for NBA players */}
          <div className="player-scatter-chart">
            <NBAScatterChart 
              playerId={player.nbaStatsRef || id.replace('nba_', '')} 
              compact={true} 
            />
          </div>
        </>
      )}

      {player.league === 'NFL' && (
        <div className="nfl-stats">
          <h3>NFL Stats</h3>
          <p><strong>Touchdowns:</strong> {player.touchdowns || 0}</p>
          <p><strong>Yards:</strong> {player.yards || 0}</p>
          <p><strong>Interceptions:</strong> {player.interceptions || 0}</p>
          <p><strong>Tackles:</strong> {player.tackles || 0}</p>
        </div>
      )}

      {player.league === 'EPL' && (
        <div className="epl-stats">
          <h3>Premier League Stats</h3>
          <p><strong>Goals:</strong> {player.goals || 0}</p>
          <p><strong>Assists:</strong> {player.assists || 0}</p>
          <p><strong>Yellow Cards:</strong> {player.yellowCards || 0}</p>
          <p><strong>Red Cards:</strong> {player.redCards || 0}</p>
          <p><strong>Key Passes:</strong> {player.keyPasses || 0}</p>
          <p><strong>Pass Accuracy:</strong> {player.passAccuracy || "N/A"}%</p>
          <p><strong>Penalty Goals:</strong> {player.penaltyGoals || 0}</p>
          <p><strong>Tackles:</strong> {player.tackles || 0}</p>
          <p><strong>Goal Saves:</strong> {player.goalSaves || 0}</p>
        </div>
      )}

      {/* Back to Team Link */}
      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
}

export default PlayerPage;
