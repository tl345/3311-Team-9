/**
 * PlayerPage Component
 * 
 * This component displays detailed statistics for an individual player.
 * It handles different sports with sport-specific stat displays:
 * - NBA: Points, assists, rebounds, blocks, steals, team
 * - NFL: Touchdowns, yards, team
 * - EPL: Goals, assists, cards, key passes, tackles, team
 * 
 * Major improvements:
 * 1. Uses SportsContext for global season state
 * 2. Dynamically fetches and displays season-specific stats
 * 3. Has specialized display for goalkeepers vs field players
 * 4. Re-fetches data when season selection changes
 * 
 * The component fetches player data based on the ID from the URL
 * and adapts its display based on the player's sport.
 */

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { getPlayerDetails, getLastUpdateTime } from '../api';
import { useSports } from '../context/SportsContext';
import NBAScatterChart from './NBAScatterChart';
import SportsBarChart from './SportsBarChart';
import { getFullTeamName } from '../utils/teamUtils'; // Utility function to convert team abbreviations to full names
import './PlayerPage.css';

function PlayerPage() {
  const { id } = useParams();
  const location = useLocation();
  const { selectedSeasons, setSeason } = useSports();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [lastUpdated, setLastUpdate] = useState(null);
  const navigate = useNavigate();

  // Set initial background based on player data or navigation state
  useEffect(() => {
    const setBackgroundClass = (league) => {
      document.body.classList.remove("premier-page", "nba-page", "nfl-page");
      if (league === "EPL") {
        document.body.classList.add("premier-page");
      } else if (league === "NBA") {
        document.body.classList.add("nba-page");
      } else if (league === "NFL") {
        document.body.classList.add("nfl-page");
      }
    };

    // First try to get league from location state
    const stateLeague = location.state?.league;
    if (stateLeague) {
      setBackgroundClass(stateLeague);
    } else if (player?.league) {
      // If no state, use player data
      setBackgroundClass(player.league);
    } else {
      // If neither available, try to determine from player ID
      const idPrefix = id.split('_')[0].toLowerCase();
      if (idPrefix === 'epl') {
        setBackgroundClass('EPL');
      } else if (idPrefix === 'nba') {
        setBackgroundClass('NBA');
      } else if (idPrefix === 'nfl') {
        setBackgroundClass('NFL');
      }
    }
  }, [location.state, player, id]);


  /**
   * Fetches player details when component mounts or season changes
   * Re-fetches data when selected season changes to update display
   */
  useEffect(() => {
    const fetchPlayerDetails = async () => {
      setLoading(true);
      try {
        // Use season from local state or global context as fallback
        const seasonToUse = selectedSeason || (
          player?.league === 'NBA' ? selectedSeasons.NBA : 
          player?.league === 'EPL' ? selectedSeasons.EPL : 
          null
        );

        // Pass selected season to API for season-specific data
        const data = await getPlayerDetails(id, seasonToUse); // Fetches all the player's detailed data
        setPlayer(data);

        // Extract available seasons from the response
        if (data) {
          let seasons = [];
        let league = '';
        
        // For EPL, extract from player.seasons array
        if (data.league === 'EPL') {
          console.log("EPL seasons data:", data.seasons);
          if (data.seasons && data.seasons.length > 0) {
            seasons = [...new Set(data.seasons.map(s => s.season))].sort((a,b) => b-a);
            league = 'EPL';
          } else {
            // Fallback to hardcoded seasons if none available
            seasons = [2024, 2023];
            league = 'EPL';
          }
        }
        // For NBA, extract from regularSeasons if available
        else if (data.league === 'NBA') {
          console.log("NBA seasons data:", data.regularSeasons);
          if (data.regularSeasons && data.regularSeasons.length > 0) {
            seasons = [...new Set(data.regularSeasons.map(s => s.season))].sort((a,b) => b-a);
          } else {
            // Fallback to hardcoded seasons if none available
            seasons = [2025, 2024]; 
          }
          league = 'NBA';
        }
        
        console.log("Available seasons:", seasons); // Debug log
        setAvailableSeasons(seasons);
        
        // Set selected season if not already selected
        if (!selectedSeason && seasons.length > 0) {
          const defaultSeason = selectedSeasons[league] || seasons[0];
          const seasonToSelect = seasons.includes(defaultSeason) ? defaultSeason : seasons[0];
          setSelectedSeason(seasonToSelect);
          setSeason(league, seasonToSelect); // Update global context
        }
          
          // Fetch last update time for this league and season
          const updateInfo = await getLastUpdateTime(league, selectedSeason || seasons[0]);
          setLastUpdate(updateInfo);
        }
      } catch (error) {
        console.error('Failed to fetch player details:', error);
      }
      setLoading(false);
    };

    fetchPlayerDetails();
  }, [id, selectedSeason, selectedSeasons]); // Re-fetch when selected season changes

  /**
   * Creates season selector dropdown for player page
   * Only shown when multiple seasons are available
   */
  const renderSeasonSelector = () => {
    if (availableSeasons.length <= 1) return null;
    
    return (
      <div className="season-selector">
        <label htmlFor="season-select">Season: </label>
        <select 
          id="season-select" 
          value={selectedSeason || ''}
          onChange={handleSeasonChange}
        >
          {availableSeasons.map(season => (
            <option key={season} value={season}>
              {player.league === 'EPL' ? `${season+1}` : season}
            </option>
          ))}
        </select>
      </div>
    );
  };

  /**
   * Handles season change event from selector
   * Updates both local state and global context when season changes
   */
  const handleSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value, 10);
    setSelectedSeason(newSeason);
    
    // Also update global context so other components can react to this change
    if (player.league) {
      setSeason(player.league, newSeason);
    }
  };
  
  // Display the last update time
  const renderLastUpdate = () => {
    if (!lastUpdated) return null;
    
    return (
      <div className="last-update">
        <small>
          Last updated: {lastUpdated.formattedTimestamp || 'Unknown'}
        </small>
      </div>
    );
  };

  // Shows loading state while fetching player data
  if (loading) return <div className="loading-container">Loading player details...</div>;

  // Show error message if player is not found
  if (!player) return <div className="error-container">Player not found.</div>;

  // Render player details with sport-specific stats
  return (
    <div className="player-details">
      {/* Player Name & Team */}
      <div className="player-header">
        <h1>{player.name}</h1>
        {renderSeasonSelector()}
        {renderLastUpdate()}
        
        {player.team && (
          <div className="player-team">
            {player.teamLogo && <img src={player.teamLogo} alt={`${player.team} Logo`} className="team-logo" />}
            <h2>{player.league === 'NBA' ? getFullTeamName(player.team) : player.team}</h2>
          </div>
        )}
      </div>

      {/* Player Image */}
      {player.league === 'EPL' && (
        <div className="player-image-container">
          {player.image ? (
            <img src={player.image} alt={player.name} className="player-image" />
          ) : (
            <p className="no-image-text">No image available</p>
          )}
        </div>
      )}

      {/* Common Player Information */}
      <div className="player-info">
        {/* Only show height and weight for EPL players */}
        {player.league === 'EPL' && (
          <>
            <p><strong>Nationality:</strong> {player.nationality || "N/A"}</p>
            <p><strong>Height:</strong> {player.height || "N/A"}</p>
            <p><strong>Weight:</strong> {player.weight || "N/A"}</p>
          </>
        )}
        <p><strong>Age:</strong> {player.age || "N/A"}</p>
        <p><strong>Appearances:</strong> {player.appearances || "N/A"}</p>
      </div>

      {/* Sport-specific Stats */}
      {player.league === 'NBA' && (
        <>
          <div className="nba-stats">
          <h3>NBA Stats (Season {selectedSeason || 'Current'})</h3>
            <p><strong>Points:</strong> {player.stats?.sportStats?.points || "0"}</p>
            <p><strong>Assists:</strong> {player.stats?.sportStats?.assists || "0"}</p>
            <p><strong>Rebounds:</strong> {player.stats?.sportStats?.rebounds || "0"}</p>
            <p><strong>Blocks:</strong> {player.stats?.sportStats?.blocks || "0"}</p>
            <p><strong>Steals:</strong> {player.stats?.sportStats?.steals || "0"}</p>
          </div>
          
          {/* Add the charts for NBA players */}
          <div className="player-charts">
            <SportsBarChart 
              player={player} 
              sport="NBA"
              season={selectedSeason}
              compact={true} 
            />

            <NBAScatterChart 
              playerId={player.nbaStatsRef || id.replace('nba_', '')} 
              compact={true} 
              season={selectedSeason}
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
        <>
          <div className="epl-stats">
            <h3>Premier League Stats</h3>
            <p><strong>Position:</strong> {player.position || "N/A"}</p>
          
            {/* Common stats for all players */}
            <p><strong>Yellow Cards:</strong> {player.yellowCards || 0}</p>
            <p><strong>Red Cards:</strong> {player.redCards || 0}</p>
          
            {/* Goalkeeper stats */}
            {player.isGoalkeeper && (
              <>
                <h4>Goalkeeper Stats</h4>
                <p><strong>Goals Saved:</strong> {player.goalsSaved || 0}</p>
                <p><strong>Goals Conceded:</strong> {player.goalsConceded || 0}</p>
                <p><strong>Penalties Saved:</strong> {player.penaltySaved || 0}</p>
              </>
            )}
          
            {/* Outfield player stats */}
            {!player.isGoalkeeper && (
              <>
                <h4>Attacking Stats</h4>
                <p><strong>Goals:</strong> {player.goals || 0}</p>
                <p><strong>Assists:</strong> {player.assists || 0}</p>
                <p><strong>Penalties Scored:</strong> {player.penaltyScored || 0}</p>
                <p><strong>Penalties Missed:</strong> {player.penaltyMissed || 0}</p>
                
                <h4>Passing & Possession</h4>
                <p><strong>Key Passes:</strong> {player.keyPasses || 0}</p>
                <p><strong>Total Passes:</strong> {player.totalPasses || 0}</p>
                <p><strong>Successful Dribbles:</strong> {player.dribblesSuccessful || 0} of {player.dribblesAttempted || 0}</p>
                
                <h4>Defensive Stats</h4>
                <p><strong>Tackles:</strong> {player.tackles || 0}</p>
                <p><strong>Interceptions:</strong> {player.interceptions || 0}</p>
                <p><strong>Duels Won:</strong> {player.duelsWon || 0} of {player.duelsTotal || 0}</p>
              </>
            )}
          </div>
          
          <div className="player-charts">
            <SportsBarChart 
              player={player} // This contains all data including seasons
              sport="EPL"
              season={selectedSeason}
              compact={true} 
            />
          </div>
        </>
      )}

      {/* Back to Team Link */}
      <Link to="/" className="back-link">← Back to Home</Link>
    </div>
  );
}

export default PlayerPage;
