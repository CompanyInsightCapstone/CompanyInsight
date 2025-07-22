import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WithAuth from "./components/WithAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompanyDetails from "./pages/CompanyDetails";
import Home from "./pages/Home";
import Watchlist from "./pages/Watchlist";
import Search from "./pages/Search";
import UserSettings from "./pages/UserSettings";
import Recommendations from "./pages/Recommendations";

const ProtectedHome = WithAuth(Home);
const ProtectedDetails = WithAuth(CompanyDetails);
const ProtectedWatchlist = WithAuth(Watchlist);
const ProtectedUserSettings = WithAuth(UserSettings);
const ProtectedSearch = WithAuth(Search);
const ProtectedRecommendations = WithAuth(Recommendations);

export default function App() {
  return (
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
        <Route path="/user-settings" element={<ProtectedUserSettings />} />

        <Route path="/search" element={<ProtectedSearch />} />
         <Route path="/recommendations" element={<ProtectedRecommendations />} />
      </Routes>
    </Router>
  );
}
