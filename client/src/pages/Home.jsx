import Header from "../components/Header";
import Footer from "../components/Footer";
import CompanyListProvider from "../contexts/CompanyListContext";
import Filter from "../components/Filter";
import ListView from "../components/ListView";
import PageButtons from "../components/PageButtons";

export default function Home() {
  return (
    <>
      <Header />
      <h2> Home Page - View a list of companies & associated fin-data </h2>
      <CompanyListProvider>
        <Filter />

        <ListView />
        <PageButtons />
      </CompanyListProvider>
      <Footer />
    </>
  );
}
