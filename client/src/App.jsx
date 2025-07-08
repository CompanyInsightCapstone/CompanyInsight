import "./App.css";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { useContext, useEffect } from "react";
import { UserContext } from "./contexts/UserContext";
import {
  API_ENDPOINTS,
  formatUrl,
  formatRequest,
  METHOD_ENUM,
} from "./api/util";
import { useQuery } from "@tanstack/react-query";
import WithAuth from "./components/WithAuth";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import CompanyDetails from "./pages/CompanyDetails";
import Home from "./pages/Home";
import Watchlist from "./pages/Watchlist";
import TrendingCompanies from "./pages/TrendingCompanies";

const ProtectedHome = WithAuth(Home);
const ProtectedDetails = WithAuth(CompanyDetails);
const ProtectedWatchlist = WithAuth(Watchlist);
const ProtectedTrendingCompanies = WithAuth(TrendingCompanies);

export default function App() {
  const { setUser } = useContext(UserContext);

  const {
    data: sessionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["check-session"],
    queryFn: async () =>
      await formatRequest(
        formatUrl(API_ENDPOINTS.CHECK_SESSION),
        METHOD_ENUM.GET,
      ),
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (sessionData?.id) {
      setUser(sessionData);
    } else if (sessionData && !sessionData.id) {
      setUser(null);
    }
  }, [sessionData, setUser]);

  useEffect(() => {
    if (error) {
      setUser(null);
    }
  }, [error, setUser]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <>
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
        </Routes>
      </Router>
    </>
  );
}
