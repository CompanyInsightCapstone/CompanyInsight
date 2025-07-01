import { useContext } from "react";
import "../styles/Item.css";
import { Link } from "react-router";

import { UserContext } from "../contexts/UserContext";

export default function CompanyItem({ company }) {
  const { isCompanySaved, saveCompany, unsaveCompany } = useContext(UserContext);

  const isSaved = isCompanySaved(company.id);

  const handleSave = async (event) => {
    event.preventDefault();
    await saveCompany(company.id, company.symbol);
  };

  const handleUnsave = async (event) => {
    event.preventDefault();
    await unsaveCompany(company.id);
  };

  return (
    <article className="list-item">
      <h2 className="list-item-header">{company.name} </h2>
      <h3 className="list-item-symbol">{company.symbol}</h3>
      <p className="list-item-typography">{company.exchange}</p>
      <p className="list-item-typography">{company.assetType}</p>
      <p className="list-item-typography">{company.ipoDate}</p>
      <p className="list-item-typography">{company.status}</p>
      <Link
        className="list-item-link"
        state={company}
        to={`/company-details/${company.id}/${company.symbol}`}
      >
        View More Details
      </Link>

      {!isSaved ? (
        <button onClick={handleSave} className="list-item-link">
          Add to Watchlist
        </button>
      ) : (
        <button onClick={handleUnsave} className="list-item-link">
          Remove from Watchlist
        </button>
      )}
    </article>
  );
}
