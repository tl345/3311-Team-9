import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./SearchBar.css"; // optional for dropdown styling

function SearchBar() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState({ players: [], teams: [] });
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (query.trim().length < 2) {
        setSuggestions({ players: [], teams: [] });
        return;
      }

      try {
        const apiUrl = window.location.hostname === 'localhost'
          ? `http://localhost:5000/api/search?q=${query}`
          : `/api/search?q=${query}`;
        
        const res = await axios.get(apiUrl);
        setSuggestions(res.data);
        setShowDropdown(true);
      } catch (err) {
        console.error("Suggestion fetch failed", err);
      }
    };

    const delayDebounce = setTimeout(fetchSuggestions, 200); // debounce
    return () => clearTimeout(delayDebounce);
  }, [query]);

  const handleNavigate = (path) => {
    setShowDropdown(false);
    setQuery("");
    navigate(path);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && query.trim() !== "") {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  return (
    <div className="search-bar-wrapper">
      <input
        type="text"
        placeholder="Search for a player or team..."
        className="search-bar"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setShowDropdown(true)}
      />

      {showDropdown && (suggestions.players.length > 0 || suggestions.teams.length > 0) && (
        <div className="suggestion-box">
          {suggestions.players.length > 0 && (
            <>
              <div className="suggestion-header">Players</div>
              {suggestions.players.map((player) => (
                <div
                  key={player._id}
                  className="suggestion-item"
                  onClick={() => handleNavigate(`/player/${player.playerId}`)}
                >
                  {player.name}
                </div>
              ))}
            </>
          )}
          {suggestions.teams.length > 0 && (
            <>
              <div className="suggestion-header">Teams</div>
              {suggestions.teams.map((team) => (
                <div
                  key={team._id}
                  className="suggestion-item"
                  onClick={() => handleNavigate(`/team/${team.league}/${team.teamId}`)}
                >
                  {team.displayName}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SearchBar;
