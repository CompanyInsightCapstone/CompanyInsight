import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useContext, useEffect } from "react";
import { SERVER_ADDRESS } from "./api/util";
import WithAuth from "./components/WithAuth";
import { UserContext } from "./contexts/UserContext";
import { METHOD_ENUM, options } from "./api/util";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompanyDetails from "./pages/CompanyDetails";
import Home from "./pages/Home";
import Watchlist from "./pages/Watchlist";

const ProtectedHome = WithAuth(Home);
const ProtectedDetails = WithAuth(CompanyDetails);
const ProtectedWatchlist = WithAuth(Watchlist);

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
          <Route path="/watchlist" element={<ProtectedWatchlist />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/company-details/:id/:symbol"
            element={<ProtectedDetails />}
          />
        </Routes>
      </Router>
    </>
  );
}
