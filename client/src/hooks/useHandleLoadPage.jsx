import { CompanyListContext } from "../contexts/CompanyListContext";
import { useCallback, useContext } from "react";

export default function useHandleLoadPage(event, jumpPageNumber) {

  const {
    companiesListContextData,
    updateFetchStatus,
    setFilteredCompaniesPageNumber,
    setCompaniesPageNumber,
  } = useContext(CompanyListContext);

  return useCallback((event, jumpPageNumber) => {
    const setPageNumberType = !companiesListContextData.filterRequest
      ? setCompaniesPageNumber
      : setFilteredCompaniesPageNumber;
    if (companiesListContextData.userSettings.infiniteScroll) {
      setPageNumberType((x) => x + 1);
    } else {
      event.preventDefault();
      if (!jumpPageNumber) {
        setPageNumberType(
          Math.max(
            0,
            (!companiesListContextData.filterRequest
              ? companiesListContextData.companiesPageNumber
              : companiesListContextData.filteredCompaniesPageNumber) +
              parseInt(event.target.value),
          ),
        );
      } else {
        setPageNumberType(Math.max(0, jumpPageNumber));
      }
      return;
    }
  }, [
    companiesListContextData.fetchStatus,
    companiesListContextData.filterRequest,
    companiesListContextData.userSettings.infiniteScroll,
    companiesListContextData.companiesPageNumber,
    companiesListContextData.filteredCompaniesPageNumber,
    updateFetchStatus,
    setCompaniesPageNumber,
    setFilteredCompaniesPageNumber,
    event,
    jumpPageNumber,
  ]);
}
