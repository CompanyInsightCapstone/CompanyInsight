import { useContext } from "react";
import { CompanyListContext } from "../contexts/CompanyListContext";
import CompanyItem from "./CompanyItem";
export default function CompanyList() {
  const { comapanies, updateCompanyLists } = useContext(CompanyListContext);

  if (!comapanies) {
    return (<p>loading or none</p>)
  } else {
    return (

        <section className="list-container">
          <h2>Companies</h2>
        <div className="list">
          {comapanies.map((company) => <CompanyItem key={company.id} company={company} />)}
        </div>
        </section>
    )
  }

}
