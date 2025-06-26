import { useEffect, useState, createContext} from "react";
import { Companies } from "../api/companies";

export const CompanyListContext = createContext();

// two states:: s0 companies[pageNumber] !== null, s1 companies[pageNumber] === null
// s0 -> s1: when user clicks next page button, and the next page is not in the map
// s1 -> s0: when user clicks next page button, and the next page is in the map
// s0 -> s0: when user clicks next page button, and the next page is in the map
// s1 -> s1: when user clicks next page button, and the next page is not in the map
// only s0 -> s1 is async and should be handled by useEffect

export default function CompanyListProvider({ children }) {
  const [companies, setCompanies] = useState(new Map());
  const [currentPageNumber, setCurrentPageNumber] = useState(0)

  const updateCurrentPageNumber = (v) => {
      setCurrentPageNumber(v)
    }

  useEffect(() => {
    if (!companies.has(currentPageNumber)) {
      async function fetchData() {
        const data = await Companies.fetchPage(currentPageNumber);
        data.pages.forEach(page => companies.set(page.pageNumber, page.companiesData))
        setCompanies(new Map(companies));
      }
      fetchData();
    }
  }, [currentPageNumber]);

  return (
    <CompanyListContext.Provider value={{ companies, currentPageNumber, updateCurrentPageNumber}}>
      {children}
    </CompanyListContext.Provider>
  );
}
