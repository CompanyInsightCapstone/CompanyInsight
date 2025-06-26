import { useEffect, useState, createContext } from "react";
import { Companies } from "../api/companies";

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const [companiesList, setCompaniesList] = useState([]);

  const [companiesPageTable, setCompaniesPageTable] = useState(new Map());
  const [filteredCompaniesPageTable, setFilteredCompaniesPageTable] = useState(new Map());

  const [companiesPageNumber, setCompaniesPageNumber] = useState(0);
  const [filteredCompaniesPageNumber, setFilteredCompaniesPageNumber] = useState(0);


  const updateCompaniesList = (newList) => {
    setCompaniesList(newList);
  }

  async function fetchDefaultPage() {
    const data = await Companies.fetchPage(companiesPageNumber);
    data.pages.forEach((page) =>
      companiesPageTable.set(page.pageNumber, page.companiesData),
    );
    setCompaniesPageTable(new Map(companiesPageTable));
    setCompaniesList(companiesPageTable.get(companiesPageNumber));
  }

  useEffect(() => {
    if (companiesPageTable.has(companiesPageNumber)) {
      setCompaniesList(companiesPageTable.get(companiesPageNumber));
    } else {
      fetchDefaultPage();
    }
  }, [companiesPageNumber, filteredCompaniesPageNumber]);


  function handleLoadPage(event) {
    event.preventDefault();
    setCompaniesPageNumber(prev => Math.max(0, prev + parseInt(event.target.value)))
  }

  return (
    <CompanyListContext.Provider
      value={{ companiesList, updateCompaniesList, handleLoadPage}}
    >
      {children}
    </CompanyListContext.Provider>
  );
}
