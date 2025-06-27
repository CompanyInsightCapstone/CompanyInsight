import "../styles/Footer.css";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { UserContext } from "../contexts/UserContext";
import { useContext, useState } from "react";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";

export default function Footer() {
  const { user, setUser } = useContext(UserContext);

  const location = useLocation();
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
    <footer className="footer">
      <section className="footer-about">
        <h3 className="footer-heading">About</h3>
        <p className="footer-text">
          Company Insights is a web-app that allows you to research companies
          that are publicly traded, in order to help you informed decisions when
          trading.
        </p>
      </section>

      <div className="footer-conrols">
        <p className="footer-copyright">© 2025 Company Insights</p>
        {location.pathname !== "/signup" && location.pathname !== "/login" && (
          <button
            style={{ marginLeft: 99 }}
            className="header-logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        )}
        {message && (
          <p className={`header-message message ${message.type}`}>
            {message.text}
          </p>
        )}
      </div>
    </footer>
  );
}
