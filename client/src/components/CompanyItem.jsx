import { Link } from "react-router";
import WatchlistButton from "./WatchlistButton";

export default function CompanyItem({ company }) {
  const companyNumericals = company.CompanyNumericals[0]
  return (
    <article className="list-item">
      <h2 className="list-item-header">{company.name} </h2>
      <h3 className="list-item-symbol">{company.symbol}</h3>
      <p className="list-item-typography">Exchange: {company.exchange}</p>
      <p className="list-item-typography">Asset Type: {company.assetType}</p>
      <p className="list-item-typography">IPO Date: {company.ipoDate}</p>
      <p className="list-item-typography">Company Status: {company.status}</p>
      <p className="list-item-typography">lastUpdated: {companyNumericals.lastUpdated}</p>
      <p className="list-item-typography"> Open: {companyNumericals.open} </p>
      <p className="list-item-typography">High: {companyNumericals.high}</p>
      <p className="list-item-typography">Low: {companyNumericals.low}</p>
      <p className="list-item-typography">Close: {companyNumericals.close}</p>
      <p className="list-item-typography">Volume: {companyNumericals.volume}</p>
      <Link
        className="list-item-link"
        state={company}
        to={`/company-details/${company.id}/${company.symbol}`}
      >
        View More Details
      </Link>
      <WatchlistButton companyId={company.id} companySymbol={company.symbol} />
    </article>
  );
}
