import { createContext, useState, useEffect } from "react";
import { CONNECTION_STATUS_ENUM } from "../constants";
import { TrendingCompaniesWebsocket } from "../api/socket";

export const TrendingCompaniesContext = createContext();


export default function TrendingCompaniesContextProvider({ children }) {
  const [trendingCompanies, setTrendingCompanies] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState(
    CONNECTION_STATUS_ENUM.CONNECTING,
  );

  useEffect(() => {
    const trendingCompaniesWebsocket = new TrendingCompaniesWebsocket({
      onTrendingCompanies: (data) => {
        setTrendingCompanies(data);
      },
      onStatusChange: (status) => {
        setConnectionStatus(status);
      },
    });
  }, []);

  return (
    <TrendingCompaniesContext.Provider
      value={{
        trendingCompanies,
        setTrendingCompanies,
        connectionStatus,
      }}
    >
      {children}
    </TrendingCompaniesContext.Provider>
  );
}
