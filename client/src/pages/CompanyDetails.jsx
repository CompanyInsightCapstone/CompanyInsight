import Header from "../components/Header";
import Footer from "../components/Footer";
import { useParams } from "react-router";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Companies } from "../api/companies";
import "../styles/CompanyDetails.css";

export default function CompanyDetails() {
  const params = useParams();
  const companyId = params.id;
  const companySymbol = params.symbol;
  const [companyDetails, setCompanyDetails] = useState(null);

  async function fetchCompanyDetails(companyId, symbol) {
    const data = (await Companies.fetchCompanyDetails(companyId, symbol)).data
      .results;
    setCompanyDetails(data);
  }

  useEffect(() => {
    if (!companyDetails) {
      fetchCompanyDetails(companyId, companySymbol);
    }
  });

  return (
    <>
      <Header />
      {!companyDetails ? (
        <p className="company-details-loading">loading....</p>
      ) : (
        <>
          <section className="company-details">
            <h1 className="company-details-title">
              NAME: {companyDetails.name}
            </h1>
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
              ACTIVE: {companyDetails.active}
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
                  DESCRIPTIONS: {companyDetails.description}
                </p>
              </section>
            )}
          </section>
        </>
      )}
      <Footer />
    </>
  );
}
