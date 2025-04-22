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
 * 
 * Updated to integrate with SportsContext, providing consistent season selection across app.
 */
import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getNbaPlayersByTeam, getEplPlayersByTeam, getNflPlayersByTeam, getNbaTeams, getEplTeams, getNflTeams } from "../api";
import { useSports } from "../context/SportsContext";
import "./TeamPage.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png";
import axios from "axios";

function TeamPage() {
  const { sport, teamName } = useParams();
  const location = useLocation(); // Detects navigation change
  const { selectedSeasons, setSeason } = useSports(); // Get selected seasons from context

  // ✅ State for players and team logo
  const [players, setPlayers] = useState([]);
  const [teamLogo, setTeamLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availableSeasons, setAvailableSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);

  useEffect(() => {
    const fetchPlayers = async () => {
      setLoading(true);
      try {
        // Remove any previous league classes
        document.body.classList.remove("premier-page", "nba-page", "nfl-page");
        
        // Set background based on sport
        if (sport === "Premier League") {
          document.body.classList.add("premier-page");
        } else if (sport === "NBA") {
          document.body.classList.add("nba-page");
        } else if (sport === "NFL") {
          document.body.classList.add("nfl-page");
        }

        let fetchedPlayers = [];
        let fetchedTeams = [];
        let season = null;
        if (sport === "NBA") {
          try {
            const baseUrl = window.location.hostname === 'localhost' 
              ? 'http://localhost:5000/api'
              : '/api';
            // Fetch available seasons from backend
            const response = await axios.get(`${baseUrl}/available-seasons/NBA`);
            const availableSeasons = response.data.length > 0 ? response.data : [2025, 2024];
            setAvailableSeasons(availableSeasons);

            // Use selected season from context, or first available season
            season = selectedSeasons.NBA || (availableSeasons.length > 0 ? availableSeasons[0] : 2025);
            
            // Fetch players for this team and season
            fetchedPlayers = await getNbaPlayersByTeam(teamName, season);
            fetchedTeams = await getNbaTeams();
          } catch (error) {
            console.error("Error fetching NBA seasons:", error);
            setAvailableSeasons([2025, 2024]); // Fallback

            // Still attempt to fetch players with default season
            season = selectedSeasons.NBA || 2025;
            fetchedPlayers = await getNbaPlayersByTeam(teamName, season);
            fetchedTeams = await getNbaTeams();
          }
        } else if (sport === "Premier League") {
          try {
            // Fetch available seasons
            const baseUrl = window.location.hostname === 'localhost' 
              ? 'http://localhost:5000/api'
              : '/api';
            const response = await axios.get(`${baseUrl}/available-seasons/EPL`);
            const availableSeasons = response.data.length > 0 ? response.data : [2024, 2023];
            setAvailableSeasons(availableSeasons);
            
            // Use selected season from context, or first available season
            season = selectedSeasons.EPL || (availableSeasons.length > 0 ? availableSeasons[0] : 2024);
            
            // Fetch players for this team and season
            fetchedPlayers = await getEplPlayersByTeam(teamName, season);
            fetchedTeams = await getEplTeams();
          } catch (error) {
            console.error("Error fetching EPL seasons:", error);
            setAvailableSeasons([2024, 2023]); // Fallback

            // Still attempt to fetch players with default season
            season = selectedSeasons.EPL || 2024;
            fetchedPlayers = await getEplPlayersByTeam(teamName, season);
            fetchedTeams = await getEplTeams();
          }
        } else if (sport === "NFL") {
          fetchedPlayers = await getNflPlayersByTeam(teamName);
          fetchedTeams = await getNflTeams();
        }

        // Set selected season to context value
        setSelectedSeason(season);

        setPlayers(fetchedPlayers);

        // Find team logo
        if (fetchedTeams.length > 0) {
          const teamData = fetchedTeams.find(team => {
            const displayName = team.name?.toLowerCase() || '';
            const searchName = teamName.toLowerCase();
            
            return displayName.includes(searchName) || 
                  searchName.includes(displayName) ||
                  displayName.replace(' fc', '').includes(searchName) ||
                  searchName.replace(' fc', '').includes(displayName);
          });

          if (teamData && teamData.logo) {
            setTeamLogo(teamData.logo);
          } else {
            console.warn("No team logo found for:", teamName);
          }
        }
      } catch (error) {
        console.error(`Failed to fetch players for ${teamName}:`, error);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, [sport, teamName, location.pathname, selectedSeasons]); // ✅ Re-fetch when navigating back

  // Season selector component
  const renderSeasonSelector = () => {
    if (availableSeasons.length <= 1 || sport === "NFL") return null;
    
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
              {sport === "Premier League" ? `${season+1}` : season}
            </option>
          ))}
        </select>
      </div>
    );
  };
  
  // Handle season change
  const handleSeasonChange = (e) => {
    const newSeason = parseInt(e.target.value, 10);
    console.log("Changing season to:", newSeason); // Debug log
    setSelectedSeason(newSeason);
    setLoading(true); // Show loading while changing
    
    // Update global context based on sport
    if (sport === "NBA") {
      setSeason('NBA', newSeason);
      getNbaPlayersByTeam(teamName, newSeason)
      .then(players => {
        console.log(`Got ${players.length} NBA players for season ${newSeason}`);
        setPlayers(players);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching players with new season:", err);
        setLoading(false);
      });
    } else if (sport === "Premier League") {
      setSeason('EPL', newSeason);
      // Force refetch players with new season
      getEplPlayersByTeam(teamName, newSeason)
      .then(players => {
        console.log(`Got ${players.length} EPL players for season ${newSeason}`);
        setPlayers(players);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching players with new season:", err);
        setLoading(false);
      });
    }
  };

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
          {renderSeasonSelector()}
        </div>

        <div className="team-header">
          {teamLogo && <img src={teamLogo} alt={`${teamName} Logo`} className="team-logo" />}
          <h1>{teamName}</h1>
        </div>

        <Link to="/" className="back-link">← Back to Home</Link>
        
        <div className="player-list">
        {players.map(player => (
          <Link 
            to={`/player/${player.id}`} 
            key={player.id} 
            className="player-card"
            state={{ league: sport === "Premier League" ? "EPL" : sport }}
          >
            {sport === "NBA" && (
              <div>
                <p>
                  {player.name} - {player.position || "N/A"} 
                  {player.number && player.number !== "N/A" ? ` - #${player.number}` : ""}
                  {player.stats?.sportStats?.points ? ` - ${player.stats.sportStats.points} PPG` : ""}
                  {player.stats?.gamesPlayed ? ` - ${player.stats.gamesPlayed} games` : ""}
                </p>
              </div>
            )}
            {sport === "Premier League" && (
              <div>
                <p>
                  {player.name} - {player.position || "N/A"}
                  {player.position && player.position.toLowerCase().includes('goalkeeper') 
                    ? ` - ${player.stats?.sportStats?.goalsSaved || 0} saves`
                    : ` - ${player.stats?.sportStats?.goals || 0} goals`}
                  {player.stats?.gamesPlayed ? ` - ${player.stats.gamesPlayed} appearances` : ''}
                </p>
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

