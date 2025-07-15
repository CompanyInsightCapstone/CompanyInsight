import TrendingCompaniesList from "../components/TrendingCompaniesList";
import TrendingCompaniesProvider from "../contexts/TrendingCompaniesContext";
import "../styles/TrendingCompanies.css";
import "../styles/Home.css";

export default function TrendingCompanies() {
  return (
    <>
      <section className="trending-section">
        <TrendingCompaniesProvider>
          <TrendingCompaniesList />
        </TrendingCompaniesProvider>
      </section>
    </>
  );
}
