import { Link, useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useContext, useState } from "react";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";
import "../styles/Header.css";

export default function Header() {
  const { user, setUser } = useContext(UserContext);
  const location = useLocation()
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleLogout = (event) => {
    event.preventDefault();
    try {
      fetch(`${SERVER_ADDRESS}/logout`, {
        ...options(METHOD_ENUM.POST),
        credentials: "include",
      });
      setUser(null);
      navigate("/login");
    } catch (error) {
      setMessage("Error logging out, try again.");
    }
  };


  const showHomeLink = () => {
    return (location.pathname === "/login" || location.pathname === "/signup") ? null :
   (<Link to="/" className="back-link">
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
    </Link>)
  }


  return (
    <header className="header">
      <div>
      <h1 className="header-title">CompanyInsights </h1>
      {user && <p className="header-user">Welcome back, {user.username}</p>}
      </div>

        {showHomeLink()}
      <button className="header-logout-button" onClick={handleLogout}>Logout</button>
      {message && <p className={`header-message message ${message.type}`}>{message.text}</p>}
    </header>
  );
}
