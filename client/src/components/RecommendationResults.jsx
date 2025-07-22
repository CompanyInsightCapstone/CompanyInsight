import { useContext } from "react";
import { RecommendationContext } from "../contexts/RecommendationContext";
import CompanyItem from "./CompanyItem";
import "../styles/SearchResults.css";

export default function  RecommendationContextResults() {
  const { RecommendationContextData } = useContext(RecommendationContext);

  return (
    <>
      <div className ="search-results">
        { RecommendationContextData.companies &&
       RecommendationContextData.companies.length > 0 && (
            <>
              <h2>We recommend these companies to you.</h2>
              <section className="list-container">
              { RecommendationContextData.companies.map((result) => {
                return <CompanyItem key={result.id} company={result} />;
              })}
              </section>
            </>
          )}
        </div>
    </>
  );
}
