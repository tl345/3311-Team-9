/**
 * Main App Component
 * 
 * This is the root component of the application that handles routing and application structure
 * It sets up the following routes:
 * - Homepage: Shows sports categories with top players and team links
 * - Team pages: Shows roster and info for a specific team
 * - Player pages: Shows detailed stats for a specific player
 * - Standings pages: Shows all teams in a league with rankings
 * - Update page: Functionality to update sports data
 * 
 * The Header component is shown on all pages for consistent navigation
 */
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/Header";
import SportsSection from "./Components/SportsSection";
import TeamPage from "./Components/TeamPage";
import PlayerPage from "./Components/PlayerPage";
import StandingsPage from "./Components/StandingsPage";
import UpdatePage from "./Components/UpdatePage";
import "./index.css";

function App() {
  return (
    <Router>
      <div className="app">
        {/* Header appears on all pages */}
        <Header />
        <Routes>
          {/* Home Page: Shows sports categories with top players */}
          <Route path="/" element={<SportsSection />} />
          
          {/* Team Page: Dynamic route with sport and team name parameters */}
          {/* Example: /team/NBA/Los Angeles Lakers */}
          <Route path="/team/:sport/:teamName" element={<TeamPage />} />
          
          {/* Player Page: Shows detailed stats for a specific player */}
          <Route path="/player/:id" element={<PlayerPage />} />
          
          {/* Standings Page: Shows all teams in a league */}
          <Route path="/standings/:league" element={<StandingsPage />} />
          
          {/* Update Page: Manually trigger data updates */}
          <Route path="/update" element={<UpdatePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
