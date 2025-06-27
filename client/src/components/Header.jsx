import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useContext, useState } from "react";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";
import "../styles/Header.css";

export default function Header() {
  const { user, setUser } = useContext(UserContext);
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
  return (
    <header>
      <h1>Company Insights</h1>
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
        >
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Back To Home
      </Link>
      <button onClick={handleLogout}>Logout</button>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </header>
  );
}
