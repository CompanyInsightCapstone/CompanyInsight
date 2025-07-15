import { useEffect, useState, createContext, useContext } from "react";
import { Companies } from "../api/companies";
import { UserContext } from "../contexts/UserContext";
import { useQuery } from "@tanstack/react-query";

export const FETCH_STATUS_TYPE = {
  IDLE: "idle",
  LOADING: "loading",
  SUCCESS: "success",
  NO_RESULTS: "no_results",
  NO_MORE_RESULTS: "no_more_results",
  ERROR: "error",
};

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {
  const { userSettings } = useContext(UserContext);
  const [companiesList, setCompaniesList] = useState([]);
  const [pageNumberUI, setPageNumberUI] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [companiesPageTable, setCompaniesPageTable] = useState(new Map());
  const [filteredCompaniesPageTable, setFilteredCompaniesPageTable] = useState(
    new Map(),
  );
  const [companiesPageNumber, setCompaniesPageNumber] = useState(0);
  const [filteredCompaniesPageNumber, setFilteredCompaniesPageNumber] =
    useState(0);
  const [filterRequest, setFilterRequest] = useState(null);
  const [fetchStatus, setFetchStatus] = useState(FETCH_STATUS_TYPE.IDLE);

  const updateFetchStatus = (newFetchStatus) => {
    setFetchStatus(newFetchStatus);
  };

  async function fetchPaginatedData(
    fetchFn,
    specificPageNumber,
    pageTable,
    setPageTable,
    additionalParams,
  ) {
    try {
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
            updateFetchStatus(FETCH_STATUS_TYPE.SUCCESS);
            return currentPageEntries;
          }
          break;

        case 404:
          updateFetchStatus(FETCH_STATUS_TYPE.NO_RESULTS);
          return [];

        case 444:
          updateFetchStatus(FETCH_STATUS_TYPE.NO_MORE_RESULTS);
          return [];

        default:
          updateFetchStatus(FETCH_STATUS_TYPE.ERROR);
          setErrorMessage(`Unexpected response status: ${data.statusCode}`);
          return [];
      }
    } catch (error) {
      updateFetchStatus(FETCH_STATUS_TYPE.ERROR);
      setErrorMessage(error.message || "An error occurred while fetching data");
      return [];
    }
  }

  const flatten = (pageNumber, pageTable) => {
    const flattenedPageTable = [];
    for (let pageId = 0; pageId <= pageNumber; pageId++) {
      const currentPage = pageTable.get(pageId);
      if (currentPage instanceof Array) {
        flattenedPageTable.push(...currentPage);
      } else {
        return flattenedPageTable;
      }
    }
    return flattenedPageTable;
  };

  async function loadData() {
    let entries = [];
    if (filterRequest) {
      if (filteredCompaniesPageTable.has(filteredCompaniesPageNumber)) {
        entries = filteredCompaniesPageTable.get(filteredCompaniesPageNumber);
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
      if (userSettings.infiniteScroll) {
        const flattenedPageTable = flatten(
          filteredCompaniesPageNumber,
          filteredCompaniesPageTable,
        );
        setCompaniesList(flattenedPageTable || []);
      } else {
        setCompaniesList(entries || []);
      }
    } else {
      if (companiesPageTable.has(companiesPageNumber)) {
        entries = companiesPageTable.get(companiesPageNumber);
      } else {
        entries = await fetchPaginatedData(
          Companies.fetchPage,
          companiesPageNumber,
          companiesPageTable,
          setCompaniesPageTable,
        );
        companiesPageTable.set(companiesPageNumber, entries);
      }
      if (userSettings.infiniteScroll) {
        const flattenedPageTable = flatten(
          companiesPageNumber,
          companiesPageTable,
        );
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
    if (
      fetchStatus === FETCH_STATUS_TYPE.NO_MORE_RESULTS ||
      fetchStatus === FETCH_STATUS_TYPE.NO_RESULTS
    ) {
      return;
    }
    updateFetchStatus(FETCH_STATUS_TYPE.LOADING);
    const setPageNumberType = !filterRequest
      ? setCompaniesPageNumber
      : setFilteredCompaniesPageNumber;
    if (userSettings.infiniteScroll) {
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
    setCompaniesList([]);
    updateFetchStatus(FETCH_STATUS_TYPE.LOADING);
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
        FETCH_STATUS_TYPE,
      }}
    >
      {children}
    </CompanyListContext.Provider>
  );
}
