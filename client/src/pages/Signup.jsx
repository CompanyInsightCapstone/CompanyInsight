import Header from "../components/Header";
import Footer from "../components/Footer";
import { useState } from "react";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";
import { useNavigate, Link } from "react-router-dom";
import "../styles/AuthForm.css";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
  });

  const [message, setMessage] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await fetch(
        `${SERVER_ADDRESS}/signup`,
        options(METHOD_ENUM.POST, formData),
      );
      const data = await response.json();
      if (response.ok) {
        setMessage({ type: "success", text: "Signup successful!" });
        navigate("/login");
      } else {
        setMessage({ type: "error", text: data.error || "Signup failed." });
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
        <h2 className="auth-form-header">Create an account </h2>
          <label className="form-label auth-form-typography" htmlFor="username">
            Create a username
          </label>
          <input
            className="form-input"
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
          />
          <label className="form-label auth-form-typography" htmlFor="password">
            Set a password
          </label>

          <input
            className="form-input"
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
          <label className="form-label auth-form-typography" htmlFor="email">
            Set your email
          </label>
          <input
            className="form-input"
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />

          <div className="btn-group">
            <button className="btn btn-primary auth-form-submit" type="submit">
              Sign Up
            </button>
          </div>
          <p className="auth-form-typography">
            Already have an account? <Link to="/login"> Sign in here</Link>
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
