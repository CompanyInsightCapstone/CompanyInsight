import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/Header.css";

export default function Header() {
  const location = useLocation();
  const [isResponsive, setIsResponsive] = useState(false);

  useEffect(() => {
    setIsResponsive(false);
  }, [location.pathname]);

  const toggleHamburgerNav = () => {
    setIsResponsive(!isResponsive);
  };


  const isActive = (path) => {
    return (path === "/" && location.pathname === "/") ||  path !== "/" && location.pathname.startsWith(path)
  };

  return (
    <header className="header">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"></link>
      <h1 className="header-title">CompanyInsights</h1>
      <nav className={`navigation ${isResponsive ? "responsive" : ""}`}>
        <ul>
          <li className="header-link">
            <Link to="/" className={isActive("/") ? "active" : ""}>Home</Link>
          </li>
          <li>
            <Link to="/watchlist" className={isActive("/watchlist") ? "active" : ""}>Watchlist</Link>
          </li>
          <li>
            <Link to="/user-settings" className={isActive("/user-settings") ? "active" : ""}>Settings</Link>
          </li>
          <li>
            <Link to="/search" className={isActive("/search") ? "active" : ""}>Search</Link>
          </li>
          <li>
            <Link to="/recommendations" className={isActive("/recommendations") ? "active" : ""}>Recommendations</Link>
          </li>
        </ul>
        <button className="icon" onClick={toggleHamburgerNav}>
          <i className="fa fa-bars"></i>
        </button>
      </nav>
    </header>
  );
}
