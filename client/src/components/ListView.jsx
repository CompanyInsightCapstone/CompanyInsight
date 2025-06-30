import CompanyItem from "./CompanyItem";
import { CompanyListContext } from "../contexts/CompanyListContext";
import { useContext } from "react";
import "../styles/List.css";

export default function ListView() {
  const { companiesList, fetchStatus, errorMessage, FETCH_STATUS } = useContext(CompanyListContext);

  const renderContent = () => {
    switch (fetchStatus) {
      case FETCH_STATUS.LOADING:
        return (
          <section className="list-container">
            <p className="list-loading">Loading companies...</p>
          </section>
        );

      case FETCH_STATUS.NO_RESULTS:
        return (
          <section className="list-container">
            <div className="list-empty-state">
              <h3>No companies found</h3>
              <p>Try adjusting your filter criteria to see more results.</p>
            </div>
          </section>
        );

      case FETCH_STATUS.NO_MORE_RESULTS:
        return (
          <section className="list-container">
            <div className="list-empty-state list-end">
              <h3>End of results</h3>
              <p>You've reached the end of the available companies.</p>
            </div>
          </section>
        );

      case FETCH_STATUS.ERROR:
        return (
          <section className="list-container">
            <div className="list-error">
              <h3>Error loading companies</h3>
              <p>{errorMessage || "An unexpected error occurred. Please try again."}</p>
            </div>
          </section>
        );

      case FETCH_STATUS.SUCCESS:
        return (
          <section className="list-container">
            {companiesList.map((elm) => (
              <CompanyItem key={elm.id} company={elm} />
            ))}
          </section>
        );

      default:
        return (
          <section className="list-container">
            <p className="list-loading">Preparing to load companies...</p>
          </section>
        );
    }
  };

  return renderContent();
}
