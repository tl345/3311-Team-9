/**
 * SportsSection Component
 * 
 * This is the main component displayed on the homepage of the application.
 * It shows three sport categories (NBA, NFL, EPL) with:
 *  - Sport logo and name
 *  - Top 5 players in that sport
 *  - Link to view all teams in that sport
 * 
 * The component fetches data when mounted and displays loading states during data retrieval
 * Each sport card has the same structure but displays different data
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getNbaPlayers, getNflPlayers, getEplPlayers, getLastUpdateTime } from "../api";
import "./SportsSection.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png";

function SportsSection() {
  // State for storing top players from each league
  const [nbaTopPlayers, setNbaTopPlayers] = useState([]);
  const [nflTopPlayers, setNflTopPlayers] = useState([]);
  const [eplTopPlayers, setEplTopPlayers] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * Effect to fetch top players data when component mounts
   * This loads the data for display in each sport category
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch top players from each league
        const nbaPlayers = await getNbaPlayers();
        setNbaTopPlayers(nbaPlayers);
        
        const nflPlayers = await getNflPlayers();
        setNflTopPlayers(nflPlayers);
        
        const eplPlayers = await getEplPlayers();
        setEplTopPlayers(eplPlayers);

        const updateTime = await getLastUpdateTime();
        setLastUpdateTime(updateTime);
      } catch (error) {
        console.error("Error fetching sports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Sports categories with their logos and dynamic player data
  const sports = [
    { 
      name: "NFL", 
      logo: nflLogo, 
      players: nflTopPlayers || []
    },
    { 
      name: "NBA", 
      logo: nbaLogo, 
      players: nbaTopPlayers || []
    },
    { 
      name: "Premier League", 
      logo: premLogo, 
      players: eplTopPlayers || []
    },
  ];

  // Show loading state while data is being fetched
  if (loading) {
    return <div className="loading">Loading sports data...</div>;
  }

  // Render the sports sections with all categories and last update time
  return (
    <div className="homepage-container">
      {/* New element: Last Update Banner */}
      {lastUpdateTime && (
        <div className="last-update-info">
          <span className="update-label">Data last updated:</span> {lastUpdateTime.formattedTimestamp}
        </div>
      )}

      <div className="sports-section">
        {sports.map((sport, index) => (
          <div key={index} className="sport-category">
            <div className="sport-header">
              <img src={sport.logo} alt={`${sport.name} Logo`} className="sport-logo" />
              <h2>{sport.name}</h2>
            </div>
            <ol>
              {sport.players.length > 0 ? (
                sport.players.map((player, idx) => (
                  <li key={idx}>
                    <Link to={`/player/${player.id}`} className="player-link">
                      {player.name}
                    </Link>
                  </li>
                ))
              ) : (
                <li style={{ fontStyle: 'italic', color: 'gray' }}>No Data Available</li>
              )}
            </ol>
            <div className="teams-section">
              <h3>
                <Link to={`/standings/${sport.name}`} className="teams-link">Teams</Link>
              </h3>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SportsSection;
