import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import "../styles/PageButtons.css";

export default function PageButtons() {
  const { handleLoadPage } = useContext(CompanyListContext);

  return (
    <div className="page-buttons-container">
      <button
        className="page-button page-button-prev"
        value={-1}
        onClick={handleLoadPage}
      >
        PREVIOUS PAGE
      </button>
      <button
        className="page-button page-button-next"
        value={1}
        onClick={handleLoadPage}
      >
        NEXT PAGE
      </button>
    </div>
  );
}
