import { useContext } from "react";
import { RecommendationContext } from "../contexts/RecommendationContext";
import CompanyItem from "./CompanyItem";
import "../styles/SearchResults.css";

export default function RecommendationResults() {
  const { RecommendationContextData } = useContext(RecommendationContext);

  return (
    <>
      <div className="search-results">
        {RecommendationContextData.companies &&
          RecommendationContextData.companies.length > 0 && (
            <>
            <div className="tooltip"><h2>We recommend these companies to you.</h2>
              <span className="tooltiptext">
                <p>
                These companies are similiar to companies from those in your watchlist,
                if your watchlist is empty, we serve you randomized companies.
                </p>
              </span>
              </div>
              <section className="list-container">
                {RecommendationContextData.companies.map((result) => {
                  return <CompanyItem key={result.id} company={result} />;
                })}
              </section>
            </>
          )}
      </div>
    </>
  );
}
