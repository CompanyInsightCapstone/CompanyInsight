import { useContext } from "react";
import { SearchContext } from "../contexts/SearchContext";
import "../styles/SearchForm.css";

export default function SearchForm() {
  const { setSearchQuery } = useContext(SearchContext);

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const query = data.get("search");
    setSearchQuery(query);
  };

  return (
    <section className="search-form-container">
      <h2>Query Search</h2>
      <form onSubmit={handleSubmit}>
        <div className="searchbox">
          <svg aria-hidden="true" viewBox="0 0 24 24">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>

          <input
            aria-label="Search for companies"
            autoComplete="off"
            inputMode="search"
            placeholder="Search for companies"
            type="search"
            id="search"
            name="search"
            className="search-text-input"
          />
        </div>
      </form>
    </section>
  );
}
