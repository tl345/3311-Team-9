import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/Header";
import SportsSection from "./Components/SportsSection";
import TeamPage from "./Components/TeamPage";
import PlayerPage from "./Components/PlayerPage"; // Import PlayerPage
import "./index.css";
import StandingsPage from "./Components/StandingsPage";

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                {/* Home Page with Leagues and Teams */}
                <Route path="/" element={<SportsSection />} />

                {/* Team Page: Dynamic path for teams like /team/NBA/Los Angeles Lakers */}
                <Route path="/team/:sport/:teamName" element={<TeamPage />} />

                {/* Player Page: New route to show player stats */}
                <Route path="/player/:id" element={<PlayerPage />} />
                <Route path="/standings/:league" element={<StandingsPage />} />
            </Routes>
        </Router>
    );
}

export default App;
