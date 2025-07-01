import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import "../styles/PageButtons.css";

export default function PageButtons() {
  const { handleLoadPage, pageNumberUI } = useContext(CompanyListContext);

  return (
    <div className="page-buttons-container">
      <button
        className="page-button page-button-prev"
        value={-1}
        onClick={handleLoadPage}
      >
        PREVIOUS PAGE
      </button>

      <div>
        <p>Current Page Number: {pageNumberUI} </p>
        <form onSubmit={(event) =>handleLoadPage(event, parseInt(event.target.pageNumber.value, 10)) }>
          <label htmlFor="pageNumber">Jump to Page:</label>
          <input type="number" id="pageNumber" name="pageNumber" className=""/>
        </form>
      </div>

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
