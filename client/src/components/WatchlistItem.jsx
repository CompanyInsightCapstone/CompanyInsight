import WatchlistButton from "./WatchlistButton";

export default function WatchlistItem({ savedCompany, callbacks }) {
  return (
    <article key={savedCompany.id} className="list-item">
      <h3 className="list-item-header">{savedCompany.company.name}</h3>
      <p className="list-item-symbol">{savedCompany.company.symbol}</p>

      <div className="list-item-info-container">
        <p className="list-item-typography">
          <span className="field-label">Current Threshold:</span> {savedCompany.percentChangeThreshold}%
        </p>
      </div>

      <div className="watchlist-form-container">
        <form
          className="threshold-form"
          onSubmit={(event) => callbacks.handleSubmit(event, savedCompany.id)}
        >
          <label className="threshold-label">Change Price Drop Threshold</label>
          <div className="threshold-input-group">
            <input
              type="number"
              name="priceDropThreshold"
              className="threshold-input"
              defaultValue={savedCompany.priceDropThreshold}
              min="0"
              max="100"
              step="0.1"
            />
            <button
              type="submit"
              className="threshold-button"
              disabled={callbacks.updateThresholdMutation.isPending}
            >
              {callbacks.updateThresholdMutation.isPending
                ? "Updating..."
                : "Update"}
            </button>
          </div>
        </form>

        {callbacks.updateThresholdMutation.isError && (
          <p className="threshold-error">
            Failed to update threshold. Please try again.
          </p>
        )}
      </div>

      <div className="list-item-actions">
        <WatchlistButton
          companyId={savedCompany.companyId}
          companySymbol={savedCompany.companySymbol}
        />
      </div>
    </article>
  );
}
