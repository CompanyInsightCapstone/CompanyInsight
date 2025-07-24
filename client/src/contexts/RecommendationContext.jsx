import { createContext, useState, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserContext } from "../contexts/UserContext";
import User from "../api/user";

export const RecommendationContext = createContext();

export default function RecommendationContextProvider({ children }) {
  const [companies, setCompanies] = useState([]);
  const { user } = useContext(UserContext);

  useQuery({
    queryKey: ["recommendations"],
    queryFn: async () => {
      const response = await User.recommendations(user.id);
      const companies = response.data;
      setCompanies(companies);
      return companies;
    },
    retry: false,
    enabled: !!user.id,
    refetchOnWindowFocus: false,
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
