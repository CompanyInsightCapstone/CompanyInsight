import CompanyItem from "./CompanyItem";
import { CompanyListContext } from "../contexts/CompanyListContext";
import { useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import { debounce, throttle } from "../api/util";
import { FETCH_STATUS_TYPE } from "../constants";
import useHandleLoadPage from "../hooks/useHandleLoadPage";
import "../styles/List.css";

export default function ListView() {
  const { companiesListContextData } = useContext(CompanyListContext);
  const { userSettings } = useContext(UserContext);
  const loadPage = useHandleLoadPage();
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
    <>
      <section className="list-container">
        <p className="list-loading">Loading companies...</p>
      </section>
    </>
  );

  const ERROR = (
    <section className="list-container">
      <div className="list-error">
        <h3>Error loading companies</h3>
        <p>
          {companiesListContextData.errorMessage ||
            "An unexpected error occurred. Please try again."}
        </p>
      </div>
    </section>
  );

  const debouncedLoadPage = debounce(loadPage, 300);

  function infinteScroll(event) {
    const heightThreshold =
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ) -
      window.innerHeight * 0.45;
    const currentHeight = Math.floor(
      window.innerHeight + window.scrollY || window.pageYOffset,
    );
    if (currentHeight >= heightThreshold) {
      debouncedLoadPage();
    }
  }

  const handleScroll = throttle(infinteScroll, 100);

  useEffect(() => {
    if (userSettings.infiniteScroll) {
      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => window.removeEventListener("scroll", handleScroll);
    }
  }, [userSettings.infiniteScroll]);

  return (

    <>
      {userSettings.infiniteScroll ? (
        <>
          {companiesListContextData.fetchStatus === FETCH_STATUS_TYPE.ERROR &&
            ERROR}
          {companiesListContextData.fetchStatus ===
            FETCH_STATUS_TYPE.NO_RESULTS && NO_RESULTS}
          {companiesListContextData.companiesList.length > 0 && (
            <section className="list-container">
              {companiesListContextData.companiesList.map((elm) => (
                <CompanyItem key={elm.id} company={elm} />
              ))}
            </section>
          )}

          {companiesListContextData.fetchStatus ===
          FETCH_STATUS_TYPE.NO_MORE_RESULTS
            ? NO_MORE_RESULTS
            : companiesListContextData.fetchStatus === FETCH_STATUS_TYPE.LOADING
              ? LOADING
              : null}
        </>
      ) : (
        <>
            <section className="list-container">
                {companiesListContextData.companiesList.map((elm) => (
                  <CompanyItem key={elm.id} company={elm} />
                ))}
            </section>

        </>
      )}
    </>
  );
}
