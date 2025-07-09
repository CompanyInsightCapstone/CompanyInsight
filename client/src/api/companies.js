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

  /**
   * Fetches time series data for a specific company with configurable parameters
   * @param {string|number} companyId - Company ID
   * @param {string} companySymbol - Company symbol
   * @param {string} from - Start date (YYYY-MM-DD format)
   * @param {string} to - End date (YYYY-MM-DD format)
   * @param {string} multiplier - Time span multiplier (default: "1/day")
   * @param {number} limit - Maximum number of results (default: 120)
   */
  async fetchCompanyTimeSeries(
    companyId,
    companySymbol,
    from = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10),
    to = new Date().toISOString().slice(0, 10),
    multiplier = "1/day",
    limit = 120,
  ) {
    const params = {
      companyId,
      companySymbol,
      from,
      to,
      multiplier,
      limit,
    };

    const response = await formatRequest(
      formatUrl(API_ENDPOINTS.COMPANY_TIME_SERIES, params),
      METHOD_ENUM.GET,
    );

    return response;
  },
};

export { Companies };
