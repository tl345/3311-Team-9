import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { Link } from "react-router-dom";

function SearchResults() {
  const location = useLocation();
  const query = new URLSearchParams(location.search).get("q");
  const [results, setResults] = useState({ players: [], teams: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query) return;

    const fetchResults = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/search?q=${query}`);
        setResults(res.data);
      } catch (err) {
        console.error("Search failed:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [query]);

  if (loading) return <p>Loading search results...</p>;
  if (!results.players.length && !results.teams.length) return <p>No results found.</p>;

  return (
    <div style={{ padding: "20px" }}>
      <h2>Search Results for "{query}"</h2>

      <h3>Players</h3>
      <ul>
        {results.players.map((player) => (
          <li key={player._id}>
            <Link to={`/player/${player.playerId}`}>{player.name}</Link>
          </li>
        ))}
      </ul>

      <h3>Teams</h3>
      <ul>
        {results.teams.map((team) => (
          <li key={team._id}>
            <Link to={`/team/${team.league}/${encodeURIComponent(team.name)}`}>{team.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SearchResults;
