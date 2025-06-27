import CompanyItem from "./CompanyItem";
import { CompanyListContext } from "../contexts/CompanyListContext";
import { useContext } from "react";
import "../styles/List.css";

export default function ListView() {
  const { companiesList } = useContext(CompanyListContext);

  if (!companiesList) {
    return <p className="list-loading">loading...</p>;
  } else {
    return (
      <section className="list-container">
        {companiesList.map((elm) => {
          return <CompanyItem key={elm.id} company={elm} />;
        })}
      </section>
    );
  }
}
