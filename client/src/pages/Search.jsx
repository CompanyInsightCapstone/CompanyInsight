import Header from "../components/Header";
import Footer from "../components/Footer";
import SearchForm from "../components/SearchForm";
import SearchResults from "../components/SearchResults";
import SearchContextProvider from "../contexts/SearchContext";

export default function Search() {
  return (
    <>
      <Header />
      <SearchContextProvider>
        <SearchForm />
        <SearchResults />
      </SearchContextProvider>
      <Footer />
    </>
  );
}
