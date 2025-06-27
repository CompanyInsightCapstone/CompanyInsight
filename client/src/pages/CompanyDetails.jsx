import Header from "../components/Header";
import Footer from "../components/Footer";
import { useParams, useLocation } from "react-router";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Companies } from "../api/companies";

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
        <p>loading....</p>
      ) : (
        <>
          <section className="company-details">
            <h1>NAME: {companyDetails.name}</h1>
            <p>TICKER:{companyDetails.ticker}</p>
            <p>MARKET: {companyDetails.market}</p>
            <p>LOCALE: {companyDetails.locale}</p>
            <p>PRIMARY EXCHANGE: {companyDetails.primary_exchange}</p>
            <p>TYPE: {companyDetails.type}</p>
            <p>ACTIVE: {companyDetails.active}</p>
            <p>CURRENCY:{companyDetails.currency_name}</p>
            <p>CIK: {companyDetails.cik}</p>
            <p>DESCRIPTIONS: {companyDetails.description}</p>
            <p>COMPOSITE FIGI:{companyDetails.composite_figi}</p>
            <p>SHARE CLASS FIGI: {companyDetails.share_class_figi}</p>
            <p> TICKER ROOT: {companyDetails.ticker_root}</p>
            <p>LIST DATE: {companyDetails.list_date}</p>
            <p>ROUND LOT{companyDetails.round_lot}</p>
          </section>
        </>
      )}

      <Footer />
    </>
  );
}
