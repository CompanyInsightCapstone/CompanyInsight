import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";

export default function WatchlistButton({ companyId, companySymbol }) {
  const { isCompanySaved, saveCompany, unsaveCompany } =
    useContext(UserContext);

  const isSaved = isCompanySaved(companyId);

  const handleSave = async (event) => {
    event.preventDefault();
    await saveCompany(companyId, companySymbol);
  };

  const handleUnsave = async (event) => {
    event.preventDefault();
    await unsaveCompany(companyId);
  };

  return (
    <>
      {!isSaved ? (
        <button onClick={handleSave} className="list-item-link">
          Add to Watchlist
        </button>
      ) : (
        <button onClick={handleUnsave} className="list-item-link">
          Remove from Watchlist
        </button>
      )}
    </>
  );
}
