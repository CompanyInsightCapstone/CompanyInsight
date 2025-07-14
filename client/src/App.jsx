import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import WithAuth from "./components/WithAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompanyDetails from "./pages/CompanyDetails";
import Home from "./pages/Home";
import Watchlist from "./pages/Watchlist";
import TrendingCompanies from "./pages/TrendingCompanies";
import UserSettings from "./pages/UserSettings";

const ProtectedHome = WithAuth(Home);
const ProtectedDetails = WithAuth(CompanyDetails);
const ProtectedWatchlist = WithAuth(Watchlist);
const ProtectedTrendingCompanies = WithAuth(TrendingCompanies);
const ProtectedUserSettings = WithAuth(UserSettings);

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ProtectedHome />} />
        <Route path="/watchlist" element={<ProtectedWatchlist />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/trending-companies"
          element={<ProtectedTrendingCompanies />}
        />
        <Route
          path="/company-details/:id/:symbol"
          element={<ProtectedDetails />}
        />
        <Route path="/user-settings" element={<ProtectedUserSettings />} />
      </Routes>
    </Router>
  );
}
