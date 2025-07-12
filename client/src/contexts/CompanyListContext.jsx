import { useEffect, useState, createContext, useContext } from "react";
import { Companies } from "../api/companies";
import { UserContext } from "../contexts/UserContext";

export const FETCH_STATUS = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  NO_RESULTS: "no_results",
  NO_MORE_RESULTS: "no_more_results",
  ERROR: "error",
};

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const { user } = useContext(UserContext);
  const [companiesList, setCompaniesList] = useState([]);
  const [pageNumberUI, setPageNumberUI] = useState(0);
  const [fetchStatus, setFetchStatus] = useState(FETCH_STATUS.IDLE);
  const [errorMessage, setErrorMessage] = useState("");
  const [companiesPageTable, setCompaniesPageTable] = useState(new Map());
  const [filteredCompaniesPageTable, setFilteredCompaniesPageTable] = useState(
    new Map(),
  );
  const [companiesPageNumber, setCompaniesPageNumber] = useState(0);
  const [filteredCompaniesPageNumber, setFilteredCompaniesPageNumber] =
    useState(0);
  const [filterRequest, setFilterRequest] = useState(null);

  async function fetchPaginatedData(
    fetchFn,
    specificPageNumber,
    pageTable,
    setPageTable,
    additionalParams,
  ) {
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

            const currentPageEntries = data.pages.find(
              (page) => page.pageNumber === specificPageNumber,
            )?.pageEntries;


            if (currentPageEntries && currentPageEntries.length > 0) {
              setFetchStatus(FETCH_STATUS.SUCCESS);
              return currentPageEntries;
            } else {
              setFetchStatus(FETCH_STATUS.NO_RESULTS);
              return [];
            }
          }
          break;

        case 404:
          setFetchStatus(FETCH_STATUS.NO_RESULTS);
          return [];

        case 444:
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
      setErrorMessage(error.message || "An error occurred while fetching data");
      return [];
    }
  }

  async function loadData() {
    let entries = [];
    if (filterRequest) {
      if (filteredCompaniesPageTable.has(filteredCompaniesPageNumber)) {
        entries = filteredCompaniesPageTable.get(filteredCompaniesPageNumber);
        setFetchStatus(
          entries && entries.length > 0
            ? FETCH_STATUS.SUCCESS
            : FETCH_STATUS.NO_RESULTS,
        );
      } else {
        entries = await fetchPaginatedData(
          Companies.fetchFilteredPage,
          filteredCompaniesPageNumber,
          filteredCompaniesPageTable,
          setFilteredCompaniesPageTable,
          filterRequest,
        );
        filteredCompaniesPageTable.set(filteredCompaniesPageNumber, entries);
      }
      if (user.infiniteScroll) {
        const flattenedPageTable = [];
        for (let pid = 0; pid <= filteredCompaniesPageNumber; pid++) {
          const currentPage = filteredCompaniesPageTable.get(pid);
          if (currentPage instanceof Array) {
            flattenedPageTable.push(...currentPage);
          } else {
            break;
          }
        }
        setCompaniesList(flattenedPageTable || []);
      } else {
        setCompaniesList(entries || []);
      }
    } else {
      if (companiesPageTable.has(companiesPageNumber)) {
        entries = companiesPageTable.get(companiesPageNumber);
        setFetchStatus(
          entries && entries.length > 0
            ? FETCH_STATUS.SUCCESS
            : FETCH_STATUS.NO_RESULTS,
        );
      } else {
        entries = await fetchPaginatedData(
          Companies.fetchPage,
          companiesPageNumber,
          companiesPageTable,
          setCompaniesPageTable,
        );
        companiesPageTable.set(companiesPageNumber, entries);
      }
      if (user.infiniteScroll) {
        const flattenedPageTable = [];
        for (let pid = 0; pid <= companiesPageNumber; pid++) {
          const currentPage = companiesPageTable.get(pid);
          if (currentPage instanceof Array) {
            flattenedPageTable.push(...currentPage);
          } else {
            break;
          }
        }
        setCompaniesList(flattenedPageTable || []);
      } else {
        setCompaniesList(entries || []);
      }
    }

    setPageNumberUI(
      filterRequest ? filteredCompaniesPageNumber : companiesPageNumber,
    );
  }

  useEffect(() => {
    loadData();
  }, [companiesPageNumber, filteredCompaniesPageNumber, filterRequest]);

  function handleLoadPage(event, jumpPageNumber) {
    const setPageNumberType = !filterRequest
      ? setCompaniesPageNumber
      : setFilteredCompaniesPageNumber;
    if (user.infiniteScroll) {
      setPageNumberType((x) => x + 1);
    } else {
      event.preventDefault();
      if (!jumpPageNumber) {
        setPageNumberType(
          Math.max(
            0,
            (!filterRequest
              ? companiesPageNumber
              : filteredCompaniesPageNumber) + parseInt(event.target.value),
          ),
        );
      } else {
        setPageNumberType(Math.max(0, jumpPageNumber));
      }
      return;
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
        updateCompaniesList: setCompaniesList,
        setNewFilterRequest: handleNewFilterRequest,
        handleLoadPage,
        FETCH_STATUS,
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
}
