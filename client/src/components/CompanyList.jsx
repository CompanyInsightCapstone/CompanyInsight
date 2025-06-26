import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import CompanyItem from "./CompanyItem";
import "../styles/List.css";

export default function CompanyList() {
  const { companies, updateCompanyLists, currentPageNumber, updateCurrentPageNumber } = useContext(CompanyListContext);
  
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
      </section>
    );
  }
}
