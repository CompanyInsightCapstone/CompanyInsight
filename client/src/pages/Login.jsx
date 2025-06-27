import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate, Link } from "react-router-dom";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";
import { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import "../styles/AuthForm.css";

export default function Login() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(`${SERVER_ADDRESS}/login`, {
        ...options(METHOD_ENUM.POST, formData),
        credentials: "include",
      });
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: "Login successful!" });
        setUser(data);
        navigate("/");
      } else {
        setMessage({ type: "error", text: data.error || "Login failed." });
      }
    } catch (error) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    }
  };

  return (
    <>
      <Header />
      <main className="auth-form-container">
        <form className="auth-form" onSubmit={handleSubmit}>
        <h2 className="auth-form-header">Log in</h2>
          <label className="form-label auth-form-typography" htmlFor="username">
            Enter your username:
          </label>
          <input
            className="form-input"
            type="text"
            name="username"
            id="username"
            value={formData.username}
            onChange={handleChange}
            required
          />

          <label className="form-label auth-form-typography" htmlFor="password">
            Enter your password:
          </label>
          <input
            className="form-input"
            type="password"
            name="password"
            id="password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <div className="btn-group">
            <button className="btn btn-primary auth-form-submit" type="submit">
              Log In
            </button>
          </div>
          <p className="auth-form-typography">
            Don't have an account? <Link to="/signup"> Sign up here</Link>
          </p>
          {message && (
            <p className={`message ${message.type} auth-form-typography`}>{message.text}</p>
          )}
        </form>
      </main>
      <Footer />
    </>
  );
}
