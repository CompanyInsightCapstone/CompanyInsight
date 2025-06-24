import Header from "../components/Header";
import Footer from "../components/Footer";
import { useNavigate, Link } from "react-router-dom";
import { METHOD_ENUM, options, SERVER_ADDRESS } from "../api/util";
import { useState, useContext } from "react";
import { UserContext } from "../contexts/UserContext";

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
            const response = await fetch(`${SERVER_ADDRESS}/login`, {...options(METHOD_ENUM.POST, formData), credentials: "include"});
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
      <Header/>
      <h2>Log in</h2>
      <form onSubmit={handleSubmit} className="login-form">
          <label>
              Username:
              <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  required
              />
          </label>

          <label>
              Password:
              <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
              />
          </label>

          <button type="submit">Log In</button>
          <p>Don't have an account? <Link to="/signup"> Sign up here</Link></p>

          {message && (
              <p className={`message ${message.type}`}>{message.text}</p>
          )}
      </form>
      <Footer/>
     </>
  );
};
