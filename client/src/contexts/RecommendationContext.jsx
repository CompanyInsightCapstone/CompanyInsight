import { createContext, useState, useContext, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserContext } from "../contexts/UserContext";
import User from "../api/user";

export const RecommendationContext = createContext();

export default function RecommendationContextProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const { user } = useContext(UserContext);
  const recttl = 300000; // 5 minutes
  const putRecommendationsInSessionStorage = (companies) => {
    const storageData = {
      companies,
      timestamp: Date.now()
    };
    sessionStorage.setItem("recommendations", JSON.stringify(storageData));
  };

  const getRecommendationsFromSessionStorage = () => {
    const storageData = sessionStorage.getItem("recommendations");
    if (!storageData) return null;

    try {
      const { companies, timestamp } = JSON.parse(storageData);
      const now = Date.now();
      const age = now - timestamp;
      if (age < recttl) {
        return companies;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  useEffect(() => {
    if (user.id) {
      const cachedCompanies = getRecommendationsFromSessionStorage();
      if (cachedCompanies) {
        setCompanies(cachedCompanies);
      }
    }
  }, [user.id]);

  useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const cachedCompanies = getRecommendationsFromSessionStorage();
      if (cachedCompanies) {
        setCompanies(cachedCompanies);
        return cachedCompanies;
      }

      const response = await User.recommendations(user.id);
      const companies = response.data;
      setCompanies(companies);
      putRecommendationsInSessionStorage(companies);
      return companies;
    },
    retry: false,
    enabled: !!user.id,
    refetchOnWindowFocus: false,
    refetchInterval: recttl,
    staleTime: recttl,
  });

  const RecommendationContextData = {
    companies,
  };

  return (
    <RecommendationContext.Provider value={{ RecommendationContextData }}>
      {children}
    </RecommendationContext.Provider>
  );
}
