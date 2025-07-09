import Header from "../components/Header";
import Footer from "../components/Footer";
import TrendingCompaniesList from "../components/TrendingCompaniesList";
import TrendingCompaniesProvider from "../contexts/TrendingCompaniesContext";

import "../styles/TrendingCompanies.css";
import "../styles/Home.css";

export default function TrendingCompanies() {
  return (
    <>
      <Header />
      <section className="trending-section">
        <TrendingCompaniesProvider>
          <TrendingCompaniesList />
        </TrendingCompaniesProvider>
      </section>
      <Footer />
    </>
  );
}
