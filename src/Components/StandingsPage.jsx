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
 * 
 * Updated to integrate with SportsContext, providing consistent season selection across app.
 */
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getNbaTeams, getNflTeams, getEplTeams } from "../api";
import { useSports } from "../context/SportsContext";
import axios from "axios";
import "./StandingsPage.css";

function StandingsPage() {
    // Extract league parameter from URL
    const { league } = useParams();
    const { selectedSeasons, setSeason } = useSports();

    // State for teams data and loading status
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [availableSeasons, setAvailableSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState(null);


    // Fetch available seasons when component mounts
    useEffect(() => {
      const fetchSeasons = async () => {
          try {
              // Map league param to API endpoint format
              const apiLeague = league === "Premier League" ? "EPL" : league;
              
              // Use your existing API base URL
              const baseUrl = window.location.hostname === 'localhost' 
                  ? 'http://localhost:5000/api'
                  : '/api';
                  
              const response = await axios.get(`${baseUrl}/available-seasons/${apiLeague}`);
              const seasons = response.data.length > 0 ? response.data : 
                  (apiLeague === "NBA" ? [2025, 2024] : [2024, 2023]);
              
              setAvailableSeasons(seasons);
              
              // Use selected season from context or first available
              const contextSeason = selectedSeasons[apiLeague];
              const initialSeason = contextSeason && seasons.includes(contextSeason) ? 
                  contextSeason : (seasons.length > 0 ? seasons[0] : null);
              
              setSelectedSeason(initialSeason);
          } catch (error) {
              console.error("Error fetching seasons:", error);
              // Fallback seasons
              const fallbackSeasons = league === "NBA" ? [2025, 2024] : [2024, 2023];
              setAvailableSeasons(fallbackSeasons);
              setSelectedSeason(fallbackSeasons[0]);
          }
      };
      
      if (league === "NBA" || league === "Premier League") {
          fetchSeasons();
      }
    }, [league, selectedSeasons]);
    

    /**
     * Effect hook to fetch teams data when component mounts, league changes, or season changes
     */
    useEffect(() => {
        const fetchTeams = async () => {
          if (!selectedSeason && (league === "NBA" || league === "Premier League")) {
            return; // Wait for season to be set
          }

            setLoading(true);
            try {
                if (league === "NBA") {
                    const nbaTeams = await getNbaTeams(selectedSeason);
                    setTeams(nbaTeams);
                } else if (league === "NFL") {
                    const nflTeams = await getNflTeams();
                    setTeams(nflTeams);
                } else if (league === "Premier League") {
                    const eplTeams = await getEplTeams(selectedSeason);
                    setTeams(eplTeams);
                }
            } catch (error) {
                console.error("Error fetching teams:", error);
            }
            setLoading(false);
        };

        fetchTeams();
    }, [league, selectedSeason]); // Re-fetch when league changes

    const handleSeasonChange = (e) => {
        const newSeason = parseInt(e.target.value, 10);
        setSelectedSeason(newSeason);
        
        // Also update global context
        if (league === "NBA") {
            setSeason("NBA", newSeason);
        } else if (league === "Premier League") {
            setSeason("EPL", newSeason);
        }
    };

    const renderSeasonSelector = () => {
        if (league === "NFL" || availableSeasons.length <= 1) return null;
        
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
                            {league === "Premier League" ? `${season}-${season+1}` : season}
                        </option>
                    ))}
                </select>
            </div>
        );
    };

    if (loading) return <p>Loading teams...</p>;

    return (
        <div className="standings-box">
          <h1 className="standings-title">{league} Standings</h1>
          {renderSeasonSelector()}
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
