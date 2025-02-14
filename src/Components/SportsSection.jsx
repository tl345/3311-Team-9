import "./SportsSection.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png";
import { useEffect, useState } from "react";
import { getNbaPlayers, getNflPlayers, getEplPlayers, getNbaTeams, getNflTeams, getEplTeams } from "../api";
import { Link } from 'react-router-dom';

function SportsSection() {
  const [nbaPlayers, setNbaPlayers] = useState([]);
  const [nflPlayers, setNflPlayers] = useState([]);
  const [eplPlayers, setEplPlayers] = useState([]);

  const [nbaTeams, setNbaTeams] = useState([]);
  const [nflTeams, setNflTeams] = useState([]);
  const [eplTeams, setEplTeams] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setNbaPlayers(await getNbaPlayers());
      setNflPlayers(await getNflPlayers());
      setEplPlayers(await getEplPlayers());

      setNbaTeams(await getNbaTeams());
      setNflTeams(await getNflTeams());
      setEplTeams(await getEplTeams());
    };

    fetchData();
  }, []);

  const sports = [
    {
      name: "NFL",
      logo: nflLogo,
      players: nflPlayers,
      teams: nflTeams,
    },
    {
      name: "NBA",
      logo: nbaLogo,
      players: nbaPlayers,
      teams: nbaTeams,
    },
    {
      name: "Premier League",
      logo: premLogo,
      players: eplPlayers,
      teams: eplTeams,
    },
  ];

  return (
    <div className="sports-section">
      {sports.map((sport, index) => (
        <div key={index} className="sport-category">
          <div className="sport-header">
            <img src={sport.logo} alt={`${sport.name} Logo`} className="sport-logo" />
            <h2>{sport.name}</h2>
          </div>
          <ol>
            {sport.players.length > 0 ? (
              sport.players.map((player, index) => (
                <li key={index}>
                  {player.name} {player.team ? `(${player.team})` : ""} {player.points ? `- ${player.points} pts` : ""}
                  {player.goals !== undefined ? `- ${player.goals} goals` : ""}
                </li>
              ))
            ) : (
              <li style={{ color: "gray", fontStyle: "italic" }}>No Data Available</li>
            )}
          </ol>

          <div className="teams-section">
            <h3>Teams:</h3>
            <ul className="team-list">
              {sport.teams.map((team, index) => (
                <li key={index}>
                  {team.logo ? (
                    <img
                      src={team.logo}
                      alt={team.name}
                      style={{ width: '24px', height: '24px', marginRight: '10px' }}
                    />
                  ) : (
                    <span style={{ marginRight: '10px' }}>
                      {sport.name === 'NBA' && '🏀'}
                      {sport.name === 'NFL' && '🏈'}
                      {sport.name === 'Premier League' && '⚽️'}
                    </span> // Placeholder icon for NBA
                  )}
                  <Link to={`/team/${sport.name}/${encodeURIComponent(team.name)}`} className="team-link">
                    {team.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SportsSection;
