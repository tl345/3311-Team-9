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
 * Attemped to update to integrate with SportsContext, providing consistent season selection across app.
 * However, did not have the correct data in the database to implement and test this.
 * 
 * Note: Background swapping is now handled centrally in App.jsx by adding/removing
 *       body classes (premier-page, nba-page, nfl-page). No wrapper div needed here.
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

  // 1) Fetch available seasons when component mounts or league changes
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        // Map "Premier League" → "EPL" for your API endpoint
        const apiLeague = league === "Premier League" ? "EPL" : league;
        const baseUrl =
          window.location.hostname === "localhost"
            ? "http://localhost:5000/api"
            : "/api";

        const response = await axios.get(
          `${baseUrl}/available-seasons/${apiLeague}`
        );
        const seasons =
          response.data.length > 0
            ? response.data
            : apiLeague === "NBA"
            ? [2025, 2024]
            : [2024, 2023];

        setAvailableSeasons(seasons);

        // Pick from context if valid, otherwise first in list
        const contextSeason = selectedSeasons[apiLeague];
        const initialSeason =
          contextSeason && seasons.includes(contextSeason)
            ? contextSeason
            : seasons[0] || null;

        setSelectedSeason(initialSeason);
      } catch (error) {
        console.error("Error fetching seasons:", error);
        const fallback =
          league === "NBA" ? [2025, 2024] : [2024, 2023];
        setAvailableSeasons(fallback);
        setSelectedSeason(fallback[0]);
      }
    };

    if (league === "NBA" || league === "Premier League") {
      fetchSeasons();
    }
  }, [league, selectedSeasons]);

  // 2) Fetch teams data whenever league or selectedSeason changes
  useEffect(() => {
    const fetchTeams = async () => {
      // Wait for selectedSeason on NBA/PL
      // if (
      //   (league === "NBA" || league === "Premier League") &&
      //   !selectedSeason
      // ) {
      //   return;
      // }

      setLoading(true);
      try {
        if (league === "NBA") {
          // Removed selectedSeason parameter for nba and epl
          setTeams(await getNbaTeams());
        } else if (league === "NFL") {
          setTeams(await getNflTeams());
        } else if (league === "Premier League") {
          setTeams(await getEplTeams());
        }
      } catch (error) {
        console.error("Error fetching teams:", error);
      }
      setLoading(false);
    };

    fetchTeams();
  }, [league]); // Removed selectedSeason dependency

  // // Handle season dropdown changes
  // const handleSeasonChange = (e) => {
  //   const newSeason = parseInt(e.target.value, 10);
  //   setSelectedSeason(newSeason);
  //   if (league === "NBA") {
  //     setSeason("NBA", newSeason);
  //   } else if (league === "Premier League") {
  //     setSeason("EPL", newSeason);
  //   }
  // };

  // // Render season selector for NBA & PL
  // const renderSeasonSelector = () => {
  //   if (league === "NFL" || availableSeasons.length <= 1) return null;
  //   return (
  //     <div className="season-selector">
  //       <label htmlFor="season-select">Season: </label>
  //       <select
  //         id="season-select"
  //         value={selectedSeason || ""}
  //         onChange={handleSeasonChange}
  //       >
  //         {availableSeasons.map((season) => (
  //           <option key={season} value={season}>
  //             {league === "Premier League"
  //               ? `${season}-${season + 1}`
  //               : season}
  //           </option>
  //         ))}
  //       </select>
  //     </div>
  //   );
  // };

  if (loading) return <p>Loading teams...</p>;

  return (
    <div className="standings-box">
      <h1 className="standings-title">{league} Standings</h1>
      {/* Season selector removed - database doesn't have sufficient season data
        {renderSeasonSelector()} 
      */}
      {league === "Premier League" ? (
        <div className="standings-table-container">
          <table className="standings-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th className="team-column">Team</th>
                <th>MP</th>
                <th>W</th>
                <th>D</th>
                <th>L</th>
                <th>Pts</th>
              </tr>
            </thead>
            <tbody>
              {teams.map((team, index) => (
                <tr key={team.name}>
                  <td className="position">{index + 1}</td>
                  <td className="team-column">
                    {team.logo && (
                      <img
                        src={team.logo}
                        alt={team.name}
                        className="team-logo"
                      />
                    )}
                    <Link to={`/team/${league}/${encodeURIComponent(team.name)}`}>
                      {team.name}
                    </Link>
                  </td>
                  <td>{team.standings?.gamesPlayed || 0}</td>
                  <td>{team.standings?.wins || 0}</td>
                  <td>{team.standings?.draws || 0}</td>
                  <td>{team.standings?.losses || 0}</td>
                  <td className="points">{team.standings?.points || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="standings-list">
          {teams.map((team, index) => (
            <li key={team.name}>
              {team.logo && (
                <img
                  src={team.logo}
                  alt={team.name}
                  style={{ width: 30, height: 30, marginRight: 10 }}
                />
              )}
              <Link to={`/team/${league}/${encodeURIComponent(team.name)}`}>
                {team.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Link to="/">← Back to Home</Link>
    </div>
  );
}

export default StandingsPage;
