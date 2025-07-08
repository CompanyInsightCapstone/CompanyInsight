import { createContext, useState, useEffect } from "react";
import { CONNECTION_STATUS_ENUM } from "../constants";
import { trendingSocket } from "../api/socket";

export const TrendingCompaniesContext = createContext();

const TRENDING_COMPANIES_CACHE_KEY = "trending-companies-cache";

const getCachedTrendingCompanies = () => {
  const cached = localStorage.getItem(TRENDING_COMPANIES_CACHE_KEY);
  if (cached) {
    const parsed = JSON.parse(cached);
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (parsed.timestamp && parsed.timestamp > fiveMinutesAgo) {
      return parsed.data || [];
    }
  }
  return [];
};

const setCachedTrendingCompanies = (data) => {
  const cacheData = {
      data,
      timestamp: Date.now(),
  };
  localStorage.setItem(
    TRENDING_COMPANIES_CACHE_KEY,
    JSON.stringify(cacheData),
  );
};

export default function TrendingCompaniesContextProvider({ children }) {
  const [trendingCompanies, setTrendingCompanies] = useState(() => getCachedTrendingCompanies());
  const [connectionStatus, setConnectionStatus] = useState(CONNECTION_STATUS_ENUM.CONNECTING);

  useEffect(() => {
    trendingSocket.connect({
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },

      onDataReceived: ({ data, isFresh, message }) => {
        if (isFresh) {
          setTrendingCompanies(data);
          setCachedTrendingCompanies(data);
        } else if (data.length === 0 && message) {
          setTrendingCompanies([]);
        } else {
          setTrendingCompanies(data);
          setCachedTrendingCompanies(data);
        }
      },

      onError: () => {
        setConnectionStatus(CONNECTION_STATUS_ENUM.ERROR);
      },
    });

    return () => {
      trendingSocket.disconnect();
    };
  }, []);

  const requestTrendingData = () => {
    trendingSocket.requestTrendingData();
  };

  return (
    <TrendingCompaniesContext.Provider
      value={{
        trendingCompanies,
        setTrendingCompanies,
        connectionStatus,
        requestTrendingData,
      }}
    >
      {children}
    </TrendingCompaniesContext.Provider>
  );
}
