import WatchlistButton from "./WatchlistButton";

export default function WatchlistItem({ savedCompany, callbacks }) {
  return (
    <article key={savedCompany.id} className="list-item">
      <h3 className="list-item-header">{savedCompany.company.name}</h3>
      <p className="list-item-symbol">{savedCompany.company.symbol}</p>
      <p className="list-item-typography">
        Current {savedCompany.percentChangeThreshold}
      </p>
      <form
        onSubmit={(event) => callbacks.handleSubmit(event, savedCompany.id)}
      >
        <label>Change Price Drop Threshold?</label>
        <input
          type="number"
          name="priceDropThreshold"
          defaultValue={savedCompany.priceDropThreshold}
          min="0"
          max="100"
          step="0.1"
        />
        <button
          type="submit"
          disabled={callbacks.updateThresholdMutation.isPending}
        >
          {callbacks.updateThresholdMutation.isPending
            ? "Updating..."
            : "Submit"}
        </button>
      </form>
      {callbacks.updateThresholdMutation.isError && (
        <p style={{ color: "red" }}>
          Failed to update threshold. Please try again.
        </p>
      )}
      <WatchlistButton
        companyId={savedCompany.companyId}
        companySymbol={savedCompany.companySymbol}
      />
    </article>
  );
}
