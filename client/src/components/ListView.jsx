import CompanyItem from "./CompanyItem";
import { CompanyListContext } from "../contexts/CompanyListContext";
import { useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { debounce, throttle } from "../api/util";
import "../styles/List.css";

export default function ListView() {
  const {
    companiesList,
    fetchStatus,
    errorMessage,
    handleLoadPage,
    FETCH_STATUS,
  } = useContext(CompanyListContext);
  const { user } = useContext(UserContext);


  const handleScroll = (event) => {
    if (Math.ceil(window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 400) {
      handleLoadPage();
    }
  };

  const NO_RESULTS = (
    <section className="list-container">
      <div className="list-empty-state">
        <h3>No companies found</h3>
        <p>Try adjusting your filter criteria to see more results.</p>
      </div>
    </section>
  );

  const NO_MORE_RESULTS = (
    <section className="list-container">
      <div className="list-empty-state list-end">
        <h3>End of results</h3>
        <p>You've reached the end of the available companies.</p>
      </div>
    </section>
  );

  const LOADING = (
    <section className="list-container">
      <p className="list-loading">Loading companies...</p>
    </section>
  );

  const ERROR = (
    <section className="list-container">
      <div className="list-error">
        <h3>Error loading companies</h3>
        <p>
          {errorMessage || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    </section>
  );

  useEffect(() => {
    if (user.infiniteScroll) {
      window.addEventListener("scroll", handleScroll);
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, []);

  const renderListContent = () => {
    if (user.infiniteScroll) {
      return (
        <>
        <section className="list-container">
        {companiesList.map((elm) => {
          return <CompanyItem key={elm.id} company={elm} />
    })}
      </section>
      {fetchStatus.LOADING && LOADING}
      {fetchStatus.NO_MORE_RESULTS && NO_MORE_RESULTS}
      </>
      )
    } else {
      switch (fetchStatus) {
        case FETCH_STATUS.NO_MORE_RESULTS:
          return NO_MORE_RESULTS;
        case FETCH_STATUS.NO_RESULTS:
          return NO_RESULTS;
        case FETCH_STATUS.ERROR:
          return ERROR;
        case FETCH_STATUS.SUCCESS:
          return (
            <section className="list-container">
              {companiesList.map((elm) => (
                <CompanyItem key={elm.id} company={elm} />
              ))}
            </section>
          );
        case FETCH_STATUS.LOADING:
        default:
          return LOADING;
      }
    }
  };

  return renderListContent();
}
