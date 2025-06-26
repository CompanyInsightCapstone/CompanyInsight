import { useEffect, useState, createContext } from "react";
import { Companies } from "../api/companies";

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const [companies, setCompanies] = useState(new Map());
  const [currentPageNumber, setCurrentPageNumber] = useState(0);

  const updateCurrentPageNumber = (v) => {
    setCurrentPageNumber(v);
  };

  useEffect(() => {
    if (!companies.has(currentPageNumber)) {
      async function fetchData() {
        const data = await Companies.fetchPage(currentPageNumber);
        data.pages.forEach((page) =>
          companies.set(page.pageNumber, page.companiesData),
        );
        setCompanies(new Map(companies));
      }
      fetchData();
    }
  }, [currentPageNumber]);

  return (
    <CompanyListContext.Provider
      value={{ companies, currentPageNumber, updateCurrentPageNumber }}
    >
      {children}
    </CompanyListContext.Provider>
  );
}
