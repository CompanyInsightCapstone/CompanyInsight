import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useContext, useEffect } from "react";
import { SERVER_ADDRESS } from "./api/util";
import WithAuth from "./components/WithAuth";
import { UserContext } from "./contexts/UserContext";
import { METHOD_ENUM, options } from "./api/util";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";

const ProtectedHome = WithAuth(Home);

export default function App() {
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {
    fetch(`${SERVER_ADDRESS}/check-session`, {
      ...options(METHOD_ENUM.GET),
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.id) {
          setUser(data);
        }
      })
      .catch((error) => {
        console.error("Error checking authentication:", error);
      });
  }, [setUser]);

  return (
    <>
      <Router>
        <Routes>
          <Route path="/" element={<ProtectedHome />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </Router>
    </>
  );
}
