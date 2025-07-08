import TrendingCompanies from "../pages/TrendingCompanies";
import { API_ENDPOINTS, formatRequest, formatUrl, METHOD_ENUM } from "./util";

const Companies = {
  /**
   * Fetches a block of pages of companies starting from the given page number
   * @param {number} pageNumber - the current page number
   */
  async fetchPage(pageNumber) {
    return await formatRequest(
      formatUrl(API_ENDPOINTS.COMPANIES, { page: pageNumber }),
      METHOD_ENUM.GET,
    );
  },

  /**
   * Fetches filtered companies with pagination
   * @param {number} pageNumber - the current page number
   * @param {Map} filterRequest - Map containing filter parameters
   */
  async fetchFilteredPage(pageNumber, filterRequest) {
    const params = { page: pageNumber };
    for (const [key, value] of filterRequest.entries()) {
      params[key] = value;
    }
    return await formatRequest(
      formatUrl(API_ENDPOINTS.COMPANIES_FILTER, params),
      METHOD_ENUM.GET,
    );
  },

  /**
   * Fetches detailed information for a specific company
   * @param {string|number} id - Company ID
   * @param {string} symbol - Company symbol
   */
  async fetchCompanyDetails(id, symbol) {
    const response = await formatRequest(
      formatUrl(API_ENDPOINTS.COMPANY_DETAILS, { symbol }, id),
      METHOD_ENUM.GET,
    );
    return response.data;
  },

  async TrendingCompanies() {},
};

export { Companies };
