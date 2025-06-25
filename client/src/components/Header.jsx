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
      <button onClick={handleLogout}>Logout</button>
      {message && <p className={`message ${message.type}`}>{message.text}</p>}
    </header>
  );
}
