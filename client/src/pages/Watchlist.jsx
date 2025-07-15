import Header from "../components/Header";
import Footer from "../components/Footer";
import WatchlistItem from "../components/WatchlistItem";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import User from "../api/user";

export default function Watchlist() {
  const { user, savedCompanies } = useContext(UserContext);

  const queryClient = useQueryClient();

  const updateThresholdMutation = useMutation({
    mutationFn: async ({ id, priceDropThreshold }) =>
      await User.updatePriceDropThreshold(id, priceDropThreshold),
    onSuccess: () => {
      queryClient.invalidateQueries(["saved-companies", user?.id]);
    },
    onError: (error) => {
      console.error("Error updating price drop threshold:", error);
    },
  });

  const handleSubmit = (event, savedCompanyId) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const priceDropThreshold = data.get("priceDropThreshold");

    if (priceDropThreshold && 0 <= priceDropThreshold <= 100) {
      updateThresholdMutation.mutate({
        id: savedCompanyId,
        priceDropThreshold: parseFloat(priceDropThreshold),
      });
    }
  };

  return (
    <>
      <Header />
      <main className="home-container">
        <h2 className="home-title">Watchlist</h2>
        <div className="list-container">
          {savedCompanies.length === 0 ? (
            <p>No companies in your watchlist yet.</p>
          ) : (
            savedCompanies.map((savedCompany) => {
              return (
                <WatchlistItem
                  key={savedCompany.id}
                  savedCompany={savedCompany}
                  callbacks={{ handleSubmit, updateThresholdMutation }}
                />
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
