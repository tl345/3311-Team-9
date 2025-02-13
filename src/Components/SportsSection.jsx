import "./SportsSection.css";
import nflLogo from "../assets/nfl-logo.png";
import nbaLogo from "../assets/nba-logo.png";
import premLogo from "../assets/prem-logo.png"; // Adjusted name for clarity

function SportsSection() {
  const sports = [
    { name: "NFL", logo: nflLogo },
    { name: "NBA", logo: nbaLogo },
    { name: "Premier League", logo: premLogo },
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
            <li>1.</li>
            <li>2.</li>
            <li>3.</li>
            <li>4.</li>
            <li>5.</li>
          </ol>
          <div className="cards">
            <button>Players</button>
            <button>Teams</button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SportsSection;
