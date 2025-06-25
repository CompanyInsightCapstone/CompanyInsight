import { useEffect, useState, createContext } from "react";
import { SERVER_ADDRESS, options, METHOD_ENUM } from "../api/util";

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const [companies, setCompanies] = useState(new Map());
  const [currentPageNumber, setCurrentPageNumber] = useState(0)

  const updateCompanyList = (newList) => {
    setCompanies(newList);
  };

  const updateCurrentPageNumber = (n) => {
    setCurrentPageNumber(n)
  }

  const fetchCompanies = async () => {
    const url = `${SERVER_ADDRESS}/api/companies?page=${currentPageNumber}`
    const response = await (
      await fetch(url, {
        ...options(METHOD_ENUM.GET),
        credentials: "include",
      })
    ).json();
    const pages = response.pages;
    pages.forEach(
        page => companies.set(page.pageNumber, page.companiesData))
    setCompanies(new Map(companies));
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  return (
    <CompanyListContext.Provider value={{ companies, updateCompanyList, currentPageNumber, updateCurrentPageNumber}}>
      {children}
    </CompanyListContext.Provider>
  );
}
