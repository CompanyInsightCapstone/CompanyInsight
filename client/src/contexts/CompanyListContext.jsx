import { useEffect, useState, createContext } from "react";
import { Companies } from "../api/companies";

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const [companiesList, setCompaniesList] = useState([]);

  const [companiesPageTable, setCompaniesPageTable] = useState(new Map());
  const [filteredCompaniesPageTable, setFilteredCompaniesPageTable] = useState(
    new Map(),
  );

  const [companiesPageNumber, setCompaniesPageNumber] = useState(0);
  const [filteredCompaniesPageNumber, setFilteredCompaniesPageNumber] =
    useState(0);

  const [filterRequest, setFilterRequest] = useState(null);

  const updateCompaniesList = (newList) => {
    setCompaniesList(newList);
  };

  async function fetchDefaultPage() {
    const data = await Companies.fetchPage(companiesPageNumber);
    data.pages.forEach((page) =>
      companiesPageTable.set(page.pageNumber, page.companiesData),
    );
    setCompaniesPageTable(new Map(companiesPageTable));
    setCompaniesList(companiesPageTable.get(companiesPageNumber));
  }
  async function fetchFilteredPage() {
    const data = await Companies.fetchFilteredPage(
      filteredCompaniesPageNumber,
      filterRequest,
    );
    data.pages.forEach((page) =>
      filteredCompaniesPageTable.set(page.pageNumber, page.companiesData),
    );
    setFilteredCompaniesPageTable(new Map(filteredCompaniesPageTable));
    setCompaniesList(
      filteredCompaniesPageTable.get(filteredCompaniesPageNumber),
    );
  }

  useEffect(() => {
    if (filterRequest) {
      if (filteredCompaniesPageTable.has(filteredCompaniesPageNumber)) {
        setCompaniesList(
          filteredCompaniesPageTable.get(filteredCompaniesPageNumber),
        );
      } else {
        fetchFilteredPage();
      }
    } else {
      if (companiesPageTable.has(companiesPageNumber)) {
        setCompaniesList(companiesPageTable.get(companiesPageNumber));
      } else {
        fetchDefaultPage();
      }
    }
  }, [companiesPageNumber, filteredCompaniesPageNumber, filterRequest]);

  function handleLoadPage(event) {
    event.preventDefault();
    const inc = !filterRequest
      ? setCompaniesPageNumber
      : setFilteredCompaniesPageNumber;
    inc((prev) => Math.max(0, prev + parseInt(event.target.value)));
  }

  return (
    <CompanyListContext.Provider
      value={{
        companiesList,
        updateCompaniesList,
        handleLoadPage,
        setFilterRequest,
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
}
