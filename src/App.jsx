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
 * - Search page: Shows search results for players and teams
 * 
 * The Header component is shown on all pages for consistent navigation.
 * 
 * Background logic:
 *  - By default <body> gets the global background via index.css.
 *  - We detect the current route in useEffect() and toggle one of:
 *      • body.premier-page   (for /standings/Premier League)
 *      • body.nba-page       (for /standings/NBA)
 *      • body.nfl-page       (for /standings/NFL)
 *    so that each standings page fully replaces the global background.
 */

import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";

import Header from "./Components/Header";
import SportsSection from "./Components/SportsSection";
import TeamPage from "./Components/TeamPage";
import PlayerPage from "./Components/PlayerPage";
import StandingsPage from "./Components/StandingsPage";
import UpdatePage from "./Components/UpdatePage";
import SearchResults from "./Components/SearchResults";

import "./index.css";

function App() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Remove any previous league classes
    document.body.classList.remove("premier-page", "nba-page", "nfl-page");

    // Function to add the appropriate class based on league/sport name
    const addLeagueClass = (sportName) => {
      if (sportName.includes("Premier")) {
        document.body.classList.add("premier-page");
      } else if (sportName.includes("NBA")) {
        document.body.classList.add("nba-page");
      } else if (sportName.includes("NFL")) {
        document.body.classList.add("nfl-page");
      }
    };

    // Check different route patterns
    if (pathname.startsWith("/standings/")) {
      // For standings pages: /standings/[league]
      const league = pathname.split("/standings/")[1];
      addLeagueClass(league);
    } else if (pathname.startsWith("/team/")) {
      // For team pages: /team/[sport]/[teamName]
      const sport = pathname.split("/team/")[1].split("/")[0];
      addLeagueClass(sport);
    } else if (pathname.startsWith("/player/")) {
      // For player pages: /player/[id]
      // The background will be set after player data is loaded
      // and the league is known in PlayerPage.jsx
    }
    // All other routes use the default body background
  }, [pathname]);

  return (
    // .app provides consistent padding & min-height
    <div className="app">
      <Header />

      <Routes>
        {/* Home Page: sports categories */}
        <Route path="/" element={<SportsSection />} />

        {/* Team Page: dynamic sport/team route */}
        <Route path="/team/:sport/:teamName" element={<TeamPage />} />

        {/* Player Page: detailed stats */}
        <Route path="/player/:id" element={<PlayerPage />} />

        {/* Standings Page: league standings */}
        <Route path="/standings/:league" element={<StandingsPage />} />

        {/* Update Page: manual data refresh */}
        <Route path="/update" element={<UpdatePage />} />

        {/* Search Results Page */}
        <Route path="/search" element={<SearchResults />} />
      </Routes>
    </div>
  );
}

export default App;
