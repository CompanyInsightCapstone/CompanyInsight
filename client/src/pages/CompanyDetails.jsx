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
          <h1 className="company-details-title">NAME: {companyDetails.name}</h1>
          {isTimeSeriesLoading && (
            <div className="chart-loading">Loading chart data...</div>
          )}

          {timeSeriesData.length > 0 && (
            <div className="chart-container">
              <h2>Stock Price Chart ({resultsCount} data points)</h2>
              <CandleStickGraph
                configPlot={{
                  data: timeSeriesData,
                  ...chartConfig,
                }}
              />
            </div>
          )}
          <p className="company-details-info">
            TICKER: {companyDetails.ticker}
          </p>
          <p className="company-details-info">
            MARKET: {companyDetails.market}
          </p>
          <p className="company-details-info">
            LOCALE: {companyDetails.locale}
          </p>
          <p className="company-details-info">
            PRIMARY EXCHANGE: {companyDetails.primary_exchange}
          </p>
          <p className="company-details-info">TYPE: {companyDetails.type}</p>
          <p className="company-details-info">
            ACTIVE: {companyDetails.active ? "Yes" : "No"}
          </p>
          <p className="company-details-info">
            CURRENCY: {companyDetails.currency_name}
          </p>
          <p className="company-details-info">CIK: {companyDetails.cik}</p>
          <p className="company-details-info">
            COMPOSITE FIGI: {companyDetails.composite_figi}
          </p>
          <p className="company-details-info">
            SHARE CLASS FIGI: {companyDetails.share_class_figi}
          </p>
          <p className="company-details-info">
            TICKER ROOT: {companyDetails.ticker_root}
          </p>
          <p className="company-details-info">
            LIST DATE: {companyDetails.list_date}
          </p>
          <p className="company-details-info">
            ROUND LOT: {companyDetails.round_lot}
          </p>

          {companyDetails.description && (
            <section className="overview">
              <p className="company-details-info company-details-description">
                DESCRIPTION: {companyDetails.description}
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
