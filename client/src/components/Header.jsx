import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useContext } from "react";
import "../styles/Header.css";

export default function Header() {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation();

  const showHomeLink = () => {
    return location.pathname === "/login" ||
      location.pathname === "/signup" ||
      location.pathname == "/" ? null : (
      <Link to="/" className="back-link">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="header-icon"
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back To Home
      </Link>
    );
  };

  return (
    <header className="header">
      <div className="h1-container">
        <h1 className="header-title">CompanyInsights </h1>
        {user && <p className="header-user">Welcome back, {user.username}</p>}
      </div>
      <div className="header-controls">{showHomeLink()}</div>
    </header>
  );
}
