import { useContext, useRef } from "react";
import { TrendingCompaniesContext } from "../contexts/TrendingCompaniesContext";
import { CONNECTION_STATUS_ENUM } from "../constants";
import "../styles/List.css";
import "../styles/Item.css";

export default function TrendingCompaniesList() {
  const { trendingCompanies, connectionStatus, requestTrendingData } =
    useContext(TrendingCompaniesContext);

  if (connectionStatus === CONNECTION_STATUS_ENUM.CONNECTING) {
    return (
      <div className="list-loading">
        Connecting to trending companies service...
      </div>
    );
  }

  if (
    connectionStatus === CONNECTION_STATUS_ENUM.ERROR ||
    connectionStatus === CONNECTION_STATUS_ENUM.DISCONNECTED
  ) {
    return (
      <div className="list-error">
        <h3>Connection Error</h3>
        <p>
          Unable to connect to trending companies service. Please try again
          later.
        </p>
      </div>
    );
  }

  if (!trendingCompanies || trendingCompanies.length === 0) {
    return (
      <div className="list-empty-state">
        <h3>No Trending Data</h3>
        <p>
          No trending companies data available at the moment. Check back later!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="list-typography">Top Trending Companies</div>

      <div className="list-container">
        {trendingCompanies.map((company, index) => (
          <div key={`${company.id}-${index}`} className="list-item">
            <div className="list-item-header">#{index + 1} Trending</div>
            <div className="list-item-symbol">{company.symbol}</div>
            <div className="list-item-typography">
              Watched by {company.count} users
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
