import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Components/Header";
import SportsSection from "./Components/SportsSection";
import TeamPage from "./Components/TeamPage"; // You will create this soon
import "./index.css";

function App() {
    return (
        <Router>
            <Header />
            <Routes>
                {/* Home Page with Leagues and Teams */}
                <Route path="/" element={<SportsSection />} />

                {/* Team Page: Dynamic path for teams like /team/NBA/Los Angeles Lakers */}
                <Route path="/team/:sport/:teamName" element={<TeamPage />} />
            </Routes>
        </Router>
    );
}

export default App;
