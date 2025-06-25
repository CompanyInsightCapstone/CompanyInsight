import Header from "../components/Header";
import Footer from "../components/Footer";
import CompanyListProvider from "../contexts/CompanyListContext";
import CompanyList from "../components/CompanyList";

export default function Home() {
  return (
    <>
      <Header />
      <h2> Home Page - View a list of companies & associated fin-data </h2>
      <CompanyListProvider>
        <CompanyList />
      </CompanyListProvider>
      <Footer />
    </>
  );
}
