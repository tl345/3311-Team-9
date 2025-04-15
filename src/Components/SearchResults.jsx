import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";
import "./SearchResults.css";

function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");
  const [results, setResults] = useState({ players: [], teams: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        console.log("Searching for:", query);
        const apiUrl = window.location.hostname === 'localhost' 
          ? `http://localhost:5000/api/search?q=${query}`
          : `/api/search?q=${query}`;
        
        const res = await axios.get(apiUrl);
        console.log("Search results:", res.data);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
        console.log("Error details:", err.response);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) return <p>Loading search results...</p>;

  if (!results.players.length && !results.teams.length) {
    return (
      <div className="search-results-box no-results">
        <p className="no-results-message">No results found for your search.</p>
      </div>
    );
  }

  return (
    <div className="search-results-box">
      {results.players.length > 0 && (
        <>
          <h3>Players</h3>
          <ul>
            {results.players.map((player) => (
              <li key={player._id}>
                <Link to={`/player/${player.playerId}`}>{player.name}</Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {results.teams.length > 0 && (
        <>
          <h3>Teams</h3>
          <ul>
            {results.teams.map((team) => (
              <li key={team._id}>
                <Link to={`/team/${team.league}/${encodeURIComponent(team.displayName)}`}>
                  {team.displayName}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default SearchResults;
