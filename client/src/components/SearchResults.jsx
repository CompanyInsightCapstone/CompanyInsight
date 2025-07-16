import { useContext } from "react";
import { SearchContext } from "../contexts/SearchContext";
import CompanyItem from "./CompanyItem";
import "../styles/SearchResults.css";

export default function SearchResults() {
  const { SearchResultsContextData } = useContext(SearchContext);

  return (
    <>
      <section className="search-results">
        {SearchResultsContextData.searchResults &&
          SearchResultsContextData.searchResults.length > 0 &&
          SearchResultsContextData.searchResults.map((result) => {
            return <CompanyItem key={result.id} company={result} />;
          })}
      </section>
    </>
  );
}
