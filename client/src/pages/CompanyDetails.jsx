import Header from "../components/Header";
import Footer from "../components/Footer";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Companies } from "../api/companies";
import "../styles/CompanyDetails.css";
import CandleStickGraph from "../components/CandleStickGraph";
import DownloadButton from "../components/DownloadButton";

export default function CompanyDetails() {
  const params = useParams();
  const companyId = params.id;
  const companySymbol = params.symbol;

  const { data: companyDetails, isLoading } = useQuery({
    queryKey: ["company-details", companyId, companySymbol],
    queryFn: async () => {
      const data = await Companies.fetchCompanyDetails(
        companyId,
        companySymbol,
      );
      const results = data.results;
      if (!data) {
        throw new Error("Failed to fetch company details");
      }
      return results;
    },
    enabled: !!(companyId && companySymbol),
    retry: 2,
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 5 * 60 * 1000,
  });

  const { data: timeSeriesResponse, isLoading: isTimeSeriesLoading } = useQuery(
    {
      queryKey: ["company-time-series", companyId, companySymbol],
      queryFn: async () => {
        const response = await Companies.fetchCompanyTimeSeries(
          companyId,
          companySymbol,
        );
        return response;
      },
      enabled: !!(companyId && companySymbol),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  );

  const timeSeriesData = timeSeriesResponse?.data?.results || [];
  const resultsCount = timeSeriesResponse?.data?.resultsCount || 0;

  const getChartDimensions = (count) => {
    const baseWidth = 800;
    const baseHeight = 400;
    const scaleFactor = Math.min(Math.max(count / 50, 0.5), 2);

    return {
      width: Math.floor(baseWidth * scaleFactor),
      height: Math.floor(baseHeight * scaleFactor),
      margin: {
        top: 50,
        right: 50,
        bottom: 60,
        left: 80,
      },
    };
  };

  const chartConfig = getChartDimensions(resultsCount);

  return (
    <>
      <Header />

      {isLoading && (
        <p className="company-details-loading">Loading company details...</p>
      )}

      {companyDetails && (
        <section className="company-details">
          <h1 className="company-details-title">{companyDetails.name}</h1>
          {isTimeSeriesLoading && (
            <div className="chart-loading">Loading chart data...</div>
          )}

          {timeSeriesData.length > 0 && (
            <div className="chart-container">
              <h2>Stock Price Chart (n = {resultsCount} )</h2>
              <CandleStickGraph
                configPlot={{
                  data: timeSeriesData,
                  ...chartConfig,
                }}
              />
            </div>
          )}
          <div className="company-details-grid">
            <p className="company-details-info">
              <strong>Ticker:</strong> {companyDetails.ticker}
            </p>
            <p className="company-details-info">
              <strong>Market:</strong> {companyDetails.market}
            </p>
            <p className="company-details-info">
              <strong>Locale:</strong> {companyDetails.locale}
            </p>
            <p className="company-details-info">
              <strong>Primary Exchange:</strong> {companyDetails.primary_exchange}
            </p>
            <p className="company-details-info">
              <strong>Type:</strong> {companyDetails.type}
            </p>
            <p className="company-details-info">
              <strong>Active:</strong> {companyDetails.active ? "Yes" : "No"}
            </p>
            <p className="company-details-info">
              <strong>Currency:</strong> {companyDetails.currency_name}
            </p>
            <p className="company-details-info">
              <strong>List Date:</strong> {companyDetails.list_date}
            </p>
          </div>

          <div className="company-details-section">
            <h3 className="company-details-subtitle">Additional Information</h3>
            <div className="company-details-grid">
              <p className="company-details-info">
                <strong>CIK:</strong> {companyDetails.cik || "N/A"}
              </p>
              <p className="company-details-info">
                <strong>Composite FIGI:</strong> {companyDetails.composite_figi || "N/A"}
              </p>
              <p className="company-details-info">
                <strong>Share Class FIGI:</strong> {companyDetails.share_class_figi || "N/A"}
              </p>
              <p className="company-details-info">
                <strong>Ticker Root:</strong> {companyDetails.ticker_root || "N/A"}
              </p>
              <p className="company-details-info">
                <strong>Round Lot:</strong> {companyDetails.round_lot || "N/A"}
              </p>
            </div>
          </div>

          {companyDetails.description && (
            <section className="overview">
              <h3 className="company-details-subtitle">Company Overview</h3>
              <p className="company-details-description">
                {companyDetails.description}
              </p>
            </section>
          )}
          <DownloadButton companyId={companyId} companySymbol={companySymbol} />
        </section>
      )}

      <Footer />
    </>
  );
}
