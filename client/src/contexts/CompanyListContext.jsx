import { useEffect, useState, createContext } from "react";
import { Companies } from "../api/companies";

export const FETCH_STATUS = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  NO_RESULTS: 'no_results',
  NO_MORE_RESULTS: 'no_more_results',
  ERROR: 'error'
};

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const [companiesList, setCompaniesList] = useState([]);
  const [pageNumberUI, setPageNumberUI] = useState(0);
  const [fetchStatus, setFetchStatus] = useState(FETCH_STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState('');

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

  async function fetchPaginatedData(fetchFn, specificPageNumber, pageTable, setPageTable, additionalParams) {
    try {
      setFetchStatus(FETCH_STATUS.LOADING);
      const data = additionalParams
        ? await fetchFn(specificPageNumber, additionalParams)
        : await fetchFn(specificPageNumber);

      switch (data.statusCode) {
        case 200:
          if (data && data.pages) {
            const newPageTable = new Map(pageTable);
            data.pages.forEach((page) => {
              newPageTable.set(page.pageNumber, page.pageEntries);
            });
            setPageTable(newPageTable);

            const currentPageEntries = data.pages.find(page => page.pageNumber === specificPageNumber)?.pageEntries;
            if (currentPageEntries && currentPageEntries.length > 0) {
              setFetchStatus(FETCH_STATUS.SUCCESS);
              return currentPageEntries;
            } else {

              setFetchStatus(FETCH_STATUS.NO_RESULTS);
              return [];
            }
          }
          break;

        case 201:
          setFetchStatus(FETCH_STATUS.NO_RESULTS);
          return [];

        case 202:
          setFetchStatus(FETCH_STATUS.NO_MORE_RESULTS);
          return [];

        default:
          setFetchStatus(FETCH_STATUS.ERROR);
          setErrorMessage(`Unexpected response status: ${data.statusCode}`);
          return [];
      }

      setFetchStatus(FETCH_STATUS.NO_RESULTS);
      return [];
    } catch (error) {
      setFetchStatus(FETCH_STATUS.ERROR);
      setErrorMessage(error.message || 'An error occurred while fetching data');
      return [];
    }
  }

  const loadData = async () => {
    let entries = [];
    if (filterRequest) {
      if (filteredCompaniesPageTable.has(filteredCompaniesPageNumber)) {
        entries = filteredCompaniesPageTable.get(filteredCompaniesPageNumber);
        setFetchStatus(entries && entries.length > 0 ? FETCH_STATUS.SUCCESS : FETCH_STATUS.NO_RESULTS);
      } else {
        entries = await fetchPaginatedData(
          Companies.fetchFilteredPage,
          filteredCompaniesPageNumber,
          filteredCompaniesPageTable,
          setFilteredCompaniesPageTable,
          filterRequest
        );
      }
    } else {
      if (companiesPageTable.has(companiesPageNumber)) {
        entries = companiesPageTable.get(companiesPageNumber);
        setFetchStatus(entries && entries.length > 0 ? FETCH_STATUS.SUCCESS : FETCH_STATUS.NO_RESULTS);
      } else {
        entries = await fetchPaginatedData(
          Companies.fetchPage,
          companiesPageNumber,
          companiesPageTable,
          setCompaniesPageTable
        );
      }
    }

    setCompaniesList(entries || []);
    setPageNumberUI(filterRequest ? filteredCompaniesPageNumber : companiesPageNumber);
  };

  useEffect(() => {
    loadData();
  }, [companiesPageNumber, filteredCompaniesPageNumber, filterRequest]);

  function handleLoadPage(event, jumpPageNumber) {
    event.preventDefault();
    const setPageNumberType = !filterRequest ? setCompaniesPageNumber : setFilteredCompaniesPageNumber;
    if (!jumpPageNumber) {
      setPageNumberType(Math.max(0, ((!filterRequest ? companiesPageNumber : filteredCompaniesPageNumber) + parseInt(event.target.value))));
    } else {
      setPageNumberType(Math.max(0, jumpPageNumber));
    }
  }

  const handleNewFilterRequest = (newFilterRequest) => {
    setFilteredCompaniesPageTable(new Map());
    setFilteredCompaniesPageNumber(0);
    setPageNumberUI(0);
    setFilterRequest(newFilterRequest);
  };

  return (
    <CompanyListContext.Provider
      value={{
        companiesList,
        pageNumberUI,
        fetchStatus,
        errorMessage,
        updateCompaniesList,
        handleLoadPage,
        setNewFilterRequest: handleNewFilterRequest,
        FETCH_STATUS,
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
}
