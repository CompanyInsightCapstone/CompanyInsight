import { useContext } from "react";
import { SearchContext } from "../contexts/SearchContext";
import CompanyItem from "./CompanyItem";
import "../styles/SearchResults.css";

export default function SearchResults() {
  const { SearchResultsContextData } = useContext(SearchContext);

  return (
    <>
      <div className="search-results">
        {SearchResultsContextData.searchResults &&
          SearchResultsContextData.searchResults.length > 0 && (
            <>
              <h2>Search Results</h2>
              <section className="list-container">
                {SearchResultsContextData.searchResults.map((result) => {
                  return <CompanyItem key={result.id} company={result} />;
                })}
              </section>
            </>
          )}
      </div>
    </>
  );
}
