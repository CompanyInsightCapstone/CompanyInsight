import { useQuery } from "@tanstack/react-query";
import { Companies } from "../api/companies";
import CandleStickGraph from "./CandleStickGraph";

export default function TrendingCompanyChart({ company, rank }) {

  const { data: timeSeriesResponse, isLoading } = useQuery({
    queryKey: ["trending-company-chart", company.companySymbol, company.companyId],
    queryFn: async () => {
      const response = await Companies.fetchCompanyTimeSeries(
        company.companyId,
        company.companySymbol,
        new Date(new Date().setDate(new Date().getDate() - 7))
          .toISOString()
          .slice(0, 10),
        new Date().toISOString().slice(0, 10),
        "1/day",
        7,
      );
      return response;
    },
    enabled: !!(company.companyId && company.companySymbol),
    refetchOnWindowFocus: false,
    staleTime: 10 * 60 * 1000,
  });

  const timeSeriesData = timeSeriesResponse?.data?.results || [];
  const resultsCount = timeSeriesResponse?.data?.resultsCount || 0;

  const chartConfig = {
    width: 400,
    height: 250,
    margin: {
      top: 20,
      right: 30,
      bottom: 40,
      left: 50,
    },
  };

  return (
    <div className="trending-chart-container">
      <h3>
        #{rank} {company.companySymbol}
      </h3>
      <p>Watched by {company.score} users</p>

      {isLoading && <div className="chart-loading">Loading chart...</div>}

      {timeSeriesData.length > 0 && (
        <CandleStickGraph
          configPlot={{
            data: timeSeriesData,
            ...chartConfig,
          }}
        />
      )}

      {!isLoading && timeSeriesData.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px", color: "#86868b" }}>
          No chart data available
        </div>
      )}
    </div>
  );
}
