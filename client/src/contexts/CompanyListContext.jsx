import { useEffect, useState, createContext } from "react";
import { Companies } from "../api/companies";

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const [companies, setCompanies] = useState(new Map());
  const [currentPageNumber, setCurrentPageNumber] = useState(0)

  const updateCompanyList = (newMap) => {
    setCompanies(newMap);
  };

  const updateCurrentPageNumber = (v) => {
    setCurrentPageNumber(newPageNumber => newPageNumber + v)
  }

  useEffect(() => {
    async function fetchData() {
      const data = await Companies.fetchPage(currentPageNumber);
      data.pages.forEach(page => companies.set(page.pageNumber, page.companiesData))
      setCompanies(new Map(companies));
    }
    fetchData();
  }, []);

  return (
    <CompanyListContext.Provider value={{ companies, updateCompanyList, currentPageNumber, updateCurrentPageNumber}}>
      {children}
    </CompanyListContext.Provider>
  );
}
