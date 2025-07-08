import Header from "../components/Header";
import Footer from "../components/Footer";
import TrendingCompaniesList from "../components/TrendingCompaniesList";
import "../styles/Home.css";

export default function TrendingCompanies() {
  return (
    <>
      <Header />
      <main className="home-container">
        <TrendingCompaniesList />
      </main>
      <Footer />
    </>
  );
}
