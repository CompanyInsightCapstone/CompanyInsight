export default function Filter() {

  return (
    <section className="filter">
      <div className="filter-controls-container">
        <div className="filter-controls">
          <div className="filter-control">
            <label htmlFor="filter-name">Name</label>
            <input type="text" id="filter-name" name="filter-name" />
          </div>
          <div className="filter-control">
            <label htmlFor="filter-ipo-date">IPO Date</label>
            <select id="filter-ipo-date" name="filter-ipo-date">
              <option value="earliest">Earliest</option>
              <option value="latest">Latest</option>
            </select>
          </div>
          <div className="filter-control">
            <label htmlFor="filter-exchange">Exchange</label>
            <select id="filter-exchange" name="filter-exchange">
              <option value="all">All</option>
              <option value="nasdaq">Nasdaq</option>
              <option value="nyse">NYSE</option>
            </select>
          </div>
          <div className="filter-control">
            <label htmlFor="filter-asset-type">Asset Type</label>
            <select id="filter-asset-type" name="filter-asset-type">
              <option value="all">All</option>
              <option value="stock">Stock</option>
              <option value="etf">ETF</option>
            </select>
          </div>
          <div className="filter-control">
            <label htmlFor="filter-status">Status</label>
            <select id="filter-status" name="filter-status">
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="delisted">Delisted</option>
              <option value="bankrupt">Bankrupt</option>
              <option value="defunct">Defunct</option>
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
