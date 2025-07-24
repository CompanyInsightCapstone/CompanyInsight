import { Link } from "react-router";
import WatchlistButton from "./WatchlistButton";

export default function CompanyItem({ company }) {
  const companyNumericals = company.CompanyNumericals[0];

  // Determine if stock is up or down
  const isUp = companyNumericals.close > companyNumericals.open;
  const isDown = companyNumericals.close < companyNumericals.open;
  const stockIndicatorClass = isUp ? "stock-up" : isDown ? "stock-down" : "stock-neutral";

  // Format numbers to 3 decimal places
  const formatNumber = (num) => {
    return Number(parseFloat(num).toFixed(3)).toLocaleString();
  };

  // Format date to be more readable
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <article className="list-item">
      <h2 className="list-item-header">{company.name}</h2>
      <h3 className="list-item-symbol">
        <span className={`stock-indicator ${stockIndicatorClass}`}></span>
        {company.symbol}
      </h3>

      <div className="list-item-info-container">
        <p className="list-item-typography"><span className="field-label">Exchange:</span> {company.exchange}</p>
        <p className="list-item-typography"><span className="field-label">Asset Type:</span> {company.assetType}</p>
        <p className="list-item-typography"><span className="field-label">IPO Date:</span> {company.ipoDate}</p>
        <p className="list-item-typography"><span className="field-label">Status:</span> {company.status}</p>
        <p className="list-item-typography"><span className="field-label">Open:</span> {formatNumber(companyNumericals.open)}</p>
        <p className="list-item-typography"><span className="field-label">Close:</span> {formatNumber(companyNumericals.close)}</p>
        <p className="list-item-typography"><span className="field-label">High:</span> {formatNumber(companyNumericals.high)}</p>
        <p className="list-item-typography"><span className="field-label">Low:</span> {formatNumber(companyNumericals.low)}</p>
        <p className="list-item-typography"><span className="field-label">Volume:</span> {formatNumber(companyNumericals.volume)}</p>
        <p className="list-item-typography"><span className="field-label">Updated:</span> {formatDate(companyNumericals.lastUpdated)}</p>
      </div>

      <div className="list-item-actions">
        <Link
          className="list-item-link"
          state={company}
          to={`/company-details/${company.id}/${company.symbol}`}
        >
          View Details
        </Link>
        <WatchlistButton companyId={company.id} companySymbol={company.symbol} />
      </div>
    </article>
  );
}
