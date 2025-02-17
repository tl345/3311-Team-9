import "./SportsSection.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png";

function SportsSection() {
  const sports = [
    { name: "NFL", logo: nflLogo, players: ["Patrick Mahomes", "Josh Allen", "Tyreek Hill", "Justin Jefferson", "Travis Kelce"] },
    { name: "NBA", logo: nbaLogo, players: [] },
    { name: "Premier League", logo: premLogo, players: ["E. Haaland (Manchester City) - 27 goals", "C. Palmer (Chelsea) - 22 goals", "A. Isak (Newcastle) - 21 goals", "O. Watkins (Aston Villa) - 19 goals", "P. Foden (Manchester City) - 19 goals"] },
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
              sport.players.map((player, idx) => (
                <li key={idx}>{player}</li>
              ))
            ) : (
              <li style={{ fontStyle: 'italic', color: 'gray' }}>No Data Available</li>
            )}
          </ol>
          <div className="teams-section">
            <h3>
              <a href={`/standings/${sport.name}`} className="team-link">Teams</a>
            </h3>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SportsSection;
