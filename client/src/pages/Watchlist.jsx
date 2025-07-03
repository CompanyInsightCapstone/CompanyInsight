import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContext, useEffect } from "react";
import { UserContext } from "../contexts/UserContext";
import User from "../api/user";

export default function Watchlist() {
  const { user, setUser, savedCompanies } = useContext(UserContext);

  const handleSubmit = (event, savedCompanyId) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const priceDropThreshold = data.get("priceDropThreshold");
    if (priceDropThreshold && 0 <= priceDropThreshold <= 100) {
      (async () => {
        await User.updatePriceDropThreshold(savedCompanyId, priceDropThreshold);
      })();
    }
  };

  return (
    <>
      <Header />
      <main className="home-container">
        <h2 className="home-title"> Watchlist (WIP)</h2>
        <div className="list-container">
          {savedCompanies.map((savedCompany) => {
            return (
              <article key={savedCompany.id} className="list-item">
                <h3 className="list-item-header">
                  {savedCompany.company.name}
                </h3>
                <p className="list-item-symbol">
                  {savedCompany.company.symbol}
                </p>
                <p className="list-item-typography">
                  Current {savedCompany.percentChangeThreshold}
                </p>
                <form
                  onSubmit={(event) => handleSubmit(event, savedCompany.id)}
                >
                  <label>Change Price Drop Threshold?</label>
                  <input
                    type="number"
                    name="priceDropThreshold"
                    value={savedCompany.priceDropThreshold}
                  />
                  <button type="submit">Submit</button>
                </form>
              </article>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}
