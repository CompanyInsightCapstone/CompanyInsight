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
        const response = await Companies.advancedSearch(searchQuery);
        return response;
      } catch (error) {
        return [];
      }
    },
    enabled: !!(searchQuery !== ""),
    retry: false,
    refetchOnWindowFocus: false,
    onSuccess: (data) => {
      setSearchResults(data);
      setSearchQuery("");
    },
    onError: (error) => {
      console.log(error);
    },
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
