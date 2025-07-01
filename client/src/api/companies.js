import {
  SERVER_ADDRESS,
  options,
  METHOD_ENUM,
  POLYGON_API_KEY,
  ALPHA_VANTAGE_KEY,
} from "./util";

const Companies = {
  /**
   * Fetches a block of pages of companies starting from the given page number
   * @param {*} pageNumber - the current page number
   */
  async fetchPage(pageNumber) {
    const url = `${SERVER_ADDRESS}/api/companies?page=${pageNumber}`;
    try {
      const response = await fetch(url, {
        ...options(METHOD_ENUM.GET),
        credentials: "include",
      });

      const data = await response.json();
      return {
        ...data,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        pages: [],
        statusCode: 500,
        error: error.message,
      };
    }
  },

  async fetchFilteredPage(pageNumber, filterRequest) {
    const urlParams = new URLSearchParams();
    urlParams.append("page", pageNumber);
    for (const [key, value] of filterRequest.entries()) {
      if (
        value !== null &&
        value !== undefined &&
        value !== "" &&
        value !== "all"
      ) {
        urlParams.append(key, value);
      }
    }
    const url = `${SERVER_ADDRESS}/api/companies/filter?${urlParams.toString()}`;
    try {
      const response = await fetch(url, {
        ...options(METHOD_ENUM.GET),
        credentials: "include",
      });

      const data = await response.json();
      return {
        ...data,
        statusCode: response.status,
      };
    } catch (error) {
      return {
        pages: [],
        statusCode: 500,
        error: error.message,
      };
    }
  },

  async fetchCompanyDetails(id, symbol) {
    const url = `${SERVER_ADDRESS}/api/companies/${id}?${new URLSearchParams({ symbol: symbol })}`;
    try {
      const response = await fetch(url, {
        ...options(METHOD_ENUM.GET),
        credentials: "include",
      });
      const data = await response.json();
      return data;
    } catch (error) {
      return null;
    }
  },
};

export { Companies };
