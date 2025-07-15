import CompanyItem from "./CompanyItem";
import { CompanyListContext } from "../contexts/CompanyListContext";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../contexts/UserContext";
import { debounce, throttle } from "../api/util";
import { FETCH_STATUS } from "../contexts/CompanyListContext";
import "../styles/List.css";

export default function ListView() {
  const {
    companiesList,
    fetchStatus,
    errorMessage,
    handleLoadPage,
    FETCH_STATUS,
  } = useContext(CompanyListContext);
  const { userSettings } = useContext(UserContext);
  const [fetchStatusLocal, setFetchStatusLocal] = useState(fetchStatus);

  useEffect(() => {
    setFetchStatusLocal(fetchStatus);
  }, [fetchStatus]);

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
          {errorMessage || "An unexpected error occurred. Please try again."}
        </p>
      </div>
    </section>
  );

  const debouncedLoadPage = debounce(handleLoadPage, 300);

  function infinteScroll(event) {
    const currentHeight = Math.floor(
      window.innerHeight + window.scrollY || window.pageYOffset,
    );
    const heightThreshold =
      Math.max(
        document.documentElement.scrollHeight,
        document.body.scrollHeight,
      ) -
      window.innerHeight * 0.45;
    const isPageEnd = currentHeight >= heightThreshold;
    if (
      isPageEnd &&
      fetchStatusLocal !== FETCH_STATUS.LOADING &&
      fetchStatusLocal !== FETCH_STATUS.NO_MORE_RESULTS
    ) {
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
          {fetchStatusLocal === FETCH_STATUS.ERROR && ERROR}
          {fetchStatusLocal === FETCH_STATUS.NO_RESULTS && NO_RESULTS}
          {companiesList.length > 0 && (
            <section className="list-container">
              {companiesList.map((elm) => (
                <CompanyItem key={elm.id} company={elm} />
              ))}
            </section>
          )}

          {(fetchStatusLocal === FETCH_STATUS.LOADING ||
            fetchStatusLocal === FETCH_STATUS.IDLE) &&
            LOADING}

          {fetchStatusLocal === FETCH_STATUS.NO_MORE_RESULTS && NO_MORE_RESULTS}
        </>
      ) : (
        <>
          {fetchStatusLocal === FETCH_STATUS.ERROR && ERROR}
          {fetchStatusLocal === FETCH_STATUS.NO_RESULTS && NO_MORE_RESULTS}
          {fetchStatusLocal === FETCH_STATUS.NO_MORE_RESULTS && NO_MORE_RESULTS}
          {fetchStatusLocal === FETCH_STATUS.LOADING && LOADING}
          {fetchStatusLocal === FETCH_STATUS.SUCCESS &&
            companiesList.length > 0 && (
              <section className="list-container">
                {companiesList.map((elm) => (
                  <CompanyItem key={elm.id} company={elm} />
                ))}
              </section>
            )}
        </>
      )}
    </>
  );
}
