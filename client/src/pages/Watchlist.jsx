import Header from "../components/Header";
import Footer from "../components/Footer";
import { useContext } from "react";
import { UserContext } from "../contexts/UserContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, formatUrl, formatRequest, METHOD_ENUM } from "../api/util";
import User from "../api/user";

export default function Watchlist() {
  const { user } = useContext(UserContext);
  const queryClient = useQueryClient();

  const { data: savedCompanies = [], isLoading, error, refetch } = useQuery({
    queryKey: ['saved-companies', user?.id],
    queryFn: async () => {
      const response = await formatRequest(formatUrl(API_ENDPOINTS.USER_SAVED_COMPANIES), METHOD_ENUM.GET);

      if (!response.ok) {
        throw new Error('Failed to fetch saved companies');
      }

      return response.savedCompanies || [];
    },
    enabled: !!user?.id,
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 2 * 60 * 1000,
  });

  const updateThresholdMutation = useMutation({
    mutationFn: async ({id, priceDropThreshold}) => await User.updatePriceDropThreshold(id, priceDropThreshold),
    onSuccess: () => { queryClient.invalidateQueries(['saved-companies', user?.id])},
    onError: (error) => { console.error('Error updating price drop threshold:', error); },
  });

  const handleSubmit = (event, savedCompanyId) => {
    event.preventDefault();
    const data = new FormData(event.target);
    const priceDropThreshold = data.get("priceDropThreshold");

    if (priceDropThreshold && 0 <= priceDropThreshold <= 100) {
      updateThresholdMutation.mutate({
        id: savedCompanyId,
        priceDropThreshold: parseFloat(priceDropThreshold)
      });
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="home-container">
          <h2 className="home-title">Watchlist</h2>
          <div>Loading your watchlist...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header />
        <main className="home-container">
          <h2 className="home-title">Watchlist</h2>
          <div>
            <p>Error loading watchlist: {error.message}</p>
            <button onClick={() => refetch()}>Try Again</button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

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
                      defaultValue={savedCompany.priceDropThreshold}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                    <button
                      type="submit"
                      disabled={updateThresholdMutation.isPending}
                    >
                      {updateThresholdMutation.isPending ? 'Updating...' : 'Submit'}
                    </button>
                  </form>
                  {updateThresholdMutation.isError && (
                    <p style={{ color: 'red' }}>
                      Failed to update threshold. Please try again.
                    </p>
                  )}
                </article>
              );
            })
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
