import { createContext, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Companies } from "../api/companies";

export const SearchContext = createContext();

export default function SearchContextProvider({ children }) {
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data } = useQuery({
    queryKey: ["advanced-search", searchQuery],
    queryFn: async () => {
      try {
        const limit = 20;
        const companies = await Companies.advancedSearch(searchQuery, limit);
        setSearchResults(companies);
        return companies;
      } catch (error) {
        return [];
      }
    },
    enabled: !!(searchQuery !== ""),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const SearchResultsContextData = {
    searchResults,
    searchQuery,
  };

  return (
    <SearchContext.Provider
      value={{ SearchResultsContextData, setSearchResults, setSearchQuery }}
    >
      {children}
    </SearchContext.Provider>
  );
}
