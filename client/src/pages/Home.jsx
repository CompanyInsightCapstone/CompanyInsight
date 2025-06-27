import Header from "../components/Header";
import Footer from "../components/Footer";
import CompanyListProvider from "../contexts/CompanyListContext";
import Filter from "../components/Filter";
import ListView from "../components/ListView";
import PageButtons from "../components/PageButtons";
import "../styles/Home.css";

export default function Home() {
  return (
    <>
      <Header />
      <main className="home-container">
        <h2 className="home-title"> Catalog (WIP)</h2>
        <CompanyListProvider>
          <Filter />
          <ListView />
          <PageButtons />
        </CompanyListProvider>
      </main>
      <Footer />
    </>
  );
}
