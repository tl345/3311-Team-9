/**
 * Header Component
 * 
 * This component appears at the top of every page and provides:
 * 1. Site branding and navigation back to homepage
 * 2. Global search functionality (not fully implemented yet)
 * 3. Access to the data update page
 * 4. Settings icon for future customization options
 * 
 * The header maintains consistent navigation regardless of which page the user is on
 */
import { Link } from "react-router-dom";
import "./Header.css";
import SearchBar from "./SearchBar";
import SettingsIcon from "./SettingsIcon";

function Header() {
  return (
    <header className="header">
      {/* Site logo/name with link back to homepage */}
      <div className="logo-container">
        <Link to="/" className="logo">
          StatZone
        </Link>
      </div>

      {/* Search functionality in the center */}
      <div className="search-container">
        <SearchBar />
      </div>
      
      {/* Empty div for flex balance */}
      <div className="placeholder-right"></div>
    </header>
  );
}

export default Header;
