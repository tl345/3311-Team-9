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
import { useSports } from "../context/SportsContext";
import "./SportsSection.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png";
import axios from "axios";

function SportsSection() {
  // State for storing top players from each league
  const { selectedSeasons, setSeason } = useSports();
  const [nbaTopPlayers, setNbaTopPlayers] = useState([]);
  const [nflTopPlayers, setNflTopPlayers] = useState([]);
  const [eplTopPlayers, setEplTopPlayers] = useState([]);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableNbaSeasons, setAvailableNbaSeasons] = useState([]);
  const [availableEplSeasons, setAvailableEplSeasons] = useState([]);

  /**
   * Effect to fetch top players data when component mounts or seasons change
   * This loads the data for display in each sport category
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch in parallel to improve speed
        const [nbaPlayersRes, nflPlayersRes, eplPlayersRes, updateTimeRes] = await Promise.all([
          getNbaPlayers(selectedSeasons.NBA).catch(err => {
            console.error("NBA fetch failed:", err);
            return []; // Return empty array on error
          }),
          getNflPlayers().catch(err => {
            console.error("NFL fetch failed:", err);
            return []; // Return empty array on error
          }),
          getEplPlayers(selectedSeasons.EPL).catch(err => {
            console.error("EPL fetch failed:", err);
            return []; // Return empty array on error
          }),
          getLastUpdateTime().catch(err => {
            console.error("Update time fetch failed:", err);
            return null; // Return null on error
          })
        ]);
        
        setNbaTopPlayers(nbaPlayersRes || []);
        setNflTopPlayers(nflPlayersRes || []);
        setEplTopPlayers(eplPlayersRes || []);
        setLastUpdateTime(updateTimeRes);
      } catch (error) {
        console.error("Error fetching sports data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeasons.NBA, selectedSeasons.EPL]); // Re-fetch data when selected seasons change

  useEffect(() => {
    async function fetchSeasons() {
      try {
        // Use your existing API base URL
        const baseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:5000/api'
          : '/api';
          
        const nbaRes = await axios.get(`${baseUrl}/available-seasons/NBA`);
        const eplRes = await axios.get(`${baseUrl}/available-seasons/EPL`);
        
        setAvailableNbaSeasons(nbaRes.data || [2025, 2024]);
        setAvailableEplSeasons(eplRes.data || [2024, 2023]);
      } catch (error) {
        console.error("Error fetching seasons:", error);
        setAvailableNbaSeasons([2025, 2024]);
        setAvailableEplSeasons([2024, 2023]);
      }
    }
    
    fetchSeasons();
  }, []);

  const handleSeasonChange = (league, e) => {
    const season = parseInt(e.target.value, 10);
    setSeason(league, season);
  };

  const renderSeasonSelector = (sport) => {
    if (sport === "NFL") return null;
    
    const league = sport === "NBA" ? "NBA" : "EPL";
    const seasons = league === "NBA" ? availableNbaSeasons : availableEplSeasons;
    
    if (seasons.length <= 1) return null;
    
    return (
      <select 
        className="season-selector"
        value={selectedSeasons[league] || ''} 
        onChange={(e) => handleSeasonChange(league, e)}
      >
        {seasons.map(season => (
          <option key={season} value={season}>
            {league === "EPL" ? `${season+1}` : season}
          </option>
        ))}
      </select>
    );
  };

  // Render season indicator for each sport
  const renderSeasonIndicator = (sport) => {
    const season = sport === "NBA" ? selectedSeasons.NBA : 
                  sport === "Premier League" ? selectedSeasons.EPL : 
                  null;
                  
    if (!season) return null;
    
    return (
      <div className="season-indicator">
        <span className="season-label">
          {sport === "Premier League" ? `${season-1}-${season} Season` : `${season} Season`}
        </span>
      </div>
    );
  };

  // Sports categories with their logos and dynamic player data
  const sports = [
    { 
      name: "Premier League", 
      logo: premLogo, 
      players: eplTopPlayers || []
    },
    { 
      name: "NBA", 
      logo: nbaLogo, 
      players: nbaTopPlayers || []
    },
    { 
      name: "NFL", 
      logo: nflLogo, 
      players: nflTopPlayers || []
    }
  ];

  // Show loading state while data is being fetched
  if (loading) {
    return <div className="loading">Loading sports data...</div>;
  }

  // Render the sports sections with all categories and last update time
  return (
    <div className="homepage-container">
      {/* Last Update Banner */}
      {/* Removed last update info block to remove the sentence and white box */}

      <div className="sports-section">
        {sports.map((sport, index) => (
          <div key={index} className="sport-category">
            <div className="sport-header">
              <img src={sport.logo} alt={`${sport.name} Logo`} className="sport-logo" />
              <h2>{sport.name}</h2>
              {sport.name !== "NFL" && renderSeasonSelector(sport.name)}
            </div>
            <ol>
              {sport.players.length > 0 ? (
                sport.players.map((player, idx) => (
                  <li key={idx}>
                    <Link 
                      to={`/player/${player.id}`} 
                      className="player-link"
                      state={{ league: sport.name === "Premier League" ? "EPL" : sport.name }}
                    >
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
