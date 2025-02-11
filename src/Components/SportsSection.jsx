import "./SportsSection.css";

function SportsSection() {
  const sports = ["NFL", "NBA", "Premier League"];

  return (
    <div className="sports-section">
      {sports.map((sport, index) => (
        <div key={index} className="sport-category">
          <h2>{sport}</h2>
          <ol>
            <li>1.</li>
            <li>2.</li>
            <li>3.</li>
            <li>4.</li>
            <li>5.</li>
          </ol>
          <div className="cards">
            <div className="card">Players</div>
            <div className="card">Teams</div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default SportsSection;
