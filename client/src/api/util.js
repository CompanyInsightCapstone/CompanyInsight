const SERVER_ADDRESS = import.meta.env.VITE_SERVER_ADDRESS;

export const METHOD_ENUM = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
};

export const API_ENDPOINTS = {
  CHECK_SESSION: "/check-session",
  LOGIN: "/login",
  SIGNUP: "/signup",
  LOGOUT: "/logout",
  COMPANIES: "/api/companies",
  COMPANIES_FILTER: "/api/companies/filter",
  COMPANY_DETAILS: "/api/companies",
  COMPANY_DOWNLOAD: "/api/companies/download",
  COMPANY_TIME_SERIES: "/api/companies/time-series",
  USER_SAVED_COMPANIES: "/api/user/companies/save",
};


// https://stackoverflow.com/questions/75988682/debounce-in-javascript
export function debounce(func, wait) {
  let timeoutId = null;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      func(...args);
    }, wait);
  };
}


export function throttle(func, wait) {
  let lastTime = 0;
  return (...args) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      func(...args);
      lastTime = now;
    }
  };
}


/**
 * Builds a complete URL with query parameters
 * @param {string} endpoint - The API endpoint from API_ENDPOINTS
 * @param {Object} params - Query parameters as key-value pairs
 * @param {string|number} pathParam - Optional path parameter to append to endpoint
 * @returns {string} Complete URL with query parameters
 */
export const formatUrl = (endpoint, params = null, pathParam = null) => {
  let url = `${SERVER_ADDRESS}${endpoint}`;
  if (pathParam !== null) {
    url += `/${pathParam}`;
  }
  if (params !== null) {
    const urlParams = new URLSearchParams(params);
    const queryString = urlParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  return url;
};

/**
 * Makes an API request with standardized options
 * @param {string} url - Complete URL for the request
 * @param {string} method - HTTP method from METHOD_ENUM
 * @param {Object} data - Request body data (for POST, PUT, PATCH)
 * @param {Object} additionalOptions - Additional fetch options
 * @returns {Promise} Fetch promise
 */
export const formatRequest = async (
  url,
  method = METHOD_ENUM.GET,
  data = null,
  additionalOptions = {},
) => {
  const requestOptions = {
    method,
    headers: {
      Accept: "application/json",
      ...(data && { "Content-Type": "application/json" }),
    },
    credentials: "include",
    ...additionalOptions,
  };

  if (
    data &&
    [METHOD_ENUM.POST, METHOD_ENUM.PUT, METHOD_ENUM.PATCH].includes(method)
  ) {
    requestOptions.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, requestOptions);
    const responseData = await response.json();

    return {
      ...responseData,
      statusCode: response.status,
      ok: response.ok,
    };
  } catch (error) {
    return {
      error: error.message,
      statusCode: 500,
      ok: false,
    };
  }
};

export const options = (methodType, data) => {
  switch (methodType) {
    case METHOD_ENUM.GET:
      return {
        method: methodType,
        headers: {
          Accept: "application/json",
        },
      };
    case METHOD_ENUM.POST:
    case METHOD_ENUM.PUT:
    case METHOD_ENUM.PATCH:
      return {
        method: methodType,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(data),
      };
    case METHOD_ENUM.DELETE:
      return {
        method: methodType,
        headers: {
          Accept: "application/json",
        },
      };
    default:
      return {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      };
  }
};

export { SERVER_ADDRESS };
