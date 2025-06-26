import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import CompanyItem from "./CompanyItem";
import "../styles/List.css";

export default function CompanyList() {
  const { companies, updateCompanyLists, currentPageNumber, updateCurrentPageNumber } = useContext(CompanyListContext);

  function loadPage(event) {
    event.preventDefault();
    updateCurrentPageNumber(parseInt(event.target.value));
  }

  if (!companies || !companies.get(0)) {
    return <p>loading or none</p>;
  } else {
    return (
      <section className="list-container">
        <h2>Companies</h2>
        <div className="list">
          {companies.get(currentPageNumber).map((company) => (
            <CompanyItem key={company.id} company={company} />
          ))}
        </div>

        {currentPageNumber !== 0 && <button value={-1} onClick={loadPage}>
          PREVIOUS PAGE
        </button>}

        <button value={1} onClick={loadPage}>
          NEXT PAGE
        </button>
      </section>
    );
  }
}
