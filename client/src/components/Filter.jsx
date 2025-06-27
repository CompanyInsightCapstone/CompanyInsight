import { useContext, useState } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";

const FILTER_FIELDS = {
  NAME: "name",
  IPO_DATE: "ipoDate",
  EXCHANGE: "exchange",
  ASSET_TYPE: "assetType",
  STATUS: "status",
};

export default function Filter() {
  const { setFilterRequest } = useContext(CompanyListContext);
  const [errorMessage, setErrorMessage] = useState("");

  const handleClear = (event) => {
    event.preventDefault();
    setFilterRequest(null);
    document.getElementById("filter-form").reset();
  };

  const isValidFilterRequest = (formData) => {
    const formEntries = Array.from(formData.entries());
    const hasValidFilter = formEntries.some(([name, value]) => {
      if (name === FILTER_FIELDS.NAME && value.trim() !== "") {
        return true;
      }
      if (
        name !== FILTER_FIELDS.NAME &&
        name !== FILTER_FIELDS.IPO_DATE &&
        value !== "all"
      ) {
        return true;
      }
      if (name === FILTER_FIELDS.IPO_DATE && value !== "") {
        return true;
      }
      return false;
    });
    return hasValidFilter;
  };

  const handleFilterSubmit = (event) => {
    event.preventDefault();
    setErrorMessage("");
    const formData = new FormData(event.target);
    if (isValidFilterRequest(formData)) {
      setFilterRequest(formData);
    } else {
      setErrorMessage(
        "Please select at least one filter option before searching.",
      );
      setTimeout(() => {
        setErrorMessage("");
      }, 5000);
    }
  };

  return (
    <section className="filter">
      <div className="filter-controls-container">
        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form id="filter-form" onSubmit={handleFilterSubmit}>
          <div className="filter-controls">
            <div className="filter-control">
              <label htmlFor={FILTER_FIELDS.NAME}>Name</label>
              <input
                type="text"
                id={FILTER_FIELDS.NAME}
                name={FILTER_FIELDS.NAME}
              />
            </div>
            <div className="filter-control">
              <label htmlFor={FILTER_FIELDS.IPO_DATE}>IPO Date</label>
              <select id={FILTER_FIELDS.IPO_DATE} name={FILTER_FIELDS.IPO_DATE}>
                <option value="">All</option>
                <option value="earliest">Earliest</option>
                <option value="latest">Latest</option>
              </select>
            </div>
            <div className="filter-control">
              <label htmlFor={FILTER_FIELDS.EXCHANGE}>Exchange</label>
              <select
                id={FILTER_FIELDS.EXCHANGE}
                name={FILTER_FIELDS.EXCHANGE}
                defaultValue="all"
              >
                <option value="all">All</option>
                <option value="NASDAQ">Nasdaq</option>
                <option value="NYSE">NYSE</option>
              </select>
            </div>
            <div className="filter-control">
              <label htmlFor={FILTER_FIELDS.ASSET_TYPE}>Asset Type</label>
              <select
                id={FILTER_FIELDS.ASSET_TYPE}
                name={FILTER_FIELDS.ASSET_TYPE}
                defaultValue="all"
              >
                ex
                <option value="all">All</option>
                <option value="Stock">Stock</option>
                <option value="ETF">ETF</option>
              </select>
            </div>
            <div className="filter-control">
              <label htmlFor={FILTER_FIELDS.STATUS}>Status</label>
              <select
                id={FILTER_FIELDS.STATUS}
                name={FILTER_FIELDS.STATUS}
                defaultValue="all"
              >
                <option value="all">All</option>
                <option value="Active">Active</option>
                <option value="Delisted">Delisted</option>
                <option value="Bankrupt">Bankrupt</option>
                <option value="Defunct">Defunct</option>
              </select>
            </div>
            <div className="filter-control filter-buttons">
              <button type="submit" className="filter-button">
                Apply Filters
              </button>
              <button onClick={handleClear} className="clear-button">
                Clear Filters
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
