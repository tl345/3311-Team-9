import "./Header.css";
import SearchBar from "./SearchBar";
import SettingsIcon from "./SettingsIcon";

function Header() {
  return (
    <header className="header">
      <h1 className="StatZone">StatZone</h1>
      <div className="header-right">
        <SearchBar />
        <SettingsIcon />
      </div>
    </header>
  );
}

export default Header;
