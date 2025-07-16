import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import { UserContext } from "../contexts/UserContext";
import useHandleLoadPage from "../hooks/useHandleLoadPage";
import "../styles/PageButtons.css";

export default function PageButtons() {
  const { userSettings } = useContext(UserContext);
  const { companiesListContextData} = useContext(CompanyListContext);
  const loadPage = useHandleLoadPage();

  if (userSettings.infiniteScroll) {
    return;
  }

  return (
    <div className="page-buttons-container">
      <button
        className="page-button page-button-prev"
        value={-1}
        onClick={loadPage}
      >
        PREVIOUS PAGE
      </button>

      <div>
        <p>Current Page Number: {companiesListContextData.pageNumberUI} </p>
        <form
          onSubmit={(event) =>
            loadPage(event, parseInt(event.target.pageNumber.value, 10))
          }
        >
          <label htmlFor="pageNumber">Jump to Page:</label>
          <input type="number" id="pageNumber" name="pageNumber" className="" />
        </form>
      </div>

      <button
        className="page-button page-button-next"
        value={1}
        onClick={loadPage}
      >
        NEXT PAGE
      </button>
    </div>
  );
}
