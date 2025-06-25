import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import CompanyItem from "./CompanyItem";
export default function CompanyList() {
  const { companies, updateCompanyLists } = useContext(CompanyListContext);

  if (!companies) {
    return (<p>loading or none</p>)
  } else {
    return (
        <section className="list-container">
          <h2>Companies</h2>
        <div className="list">
          {companies.map((company) => <CompanyItem key={company.id} company={company} />)}
        </div>
        </section>
    )
  }

}
