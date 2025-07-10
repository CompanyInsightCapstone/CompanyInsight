import { useContext } from "react";
import { TrendingCompaniesContext } from "../contexts/TrendingCompaniesContext";
import { CONNECTION_STATUS_ENUM } from "../constants";
import TrendingCompanyChart from "./TrendingCompanyChart";
import "../styles/List.css";
import "../styles/Item.css";
import "../styles/CandleStickGraph.css";

export default function TrendingCompaniesList() {
  const { trendingCompanies, connectionStatus } = useContext(
    TrendingCompaniesContext,
  );

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
      <div className="list-typography">Top 5 Trending Companies</div>

      <div className="trending-charts-grid">
        {trendingCompanies.slice(0, 5).map((company, index) => (
          <TrendingCompanyChart
            key={company.companyId}
            company={company}
            rank={index + 1}
          />
        ))}
      </div>
    </>
  );
}
