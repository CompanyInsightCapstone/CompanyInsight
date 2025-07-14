import { API_ENDPOINTS, formatRequest, formatUrl, METHOD_ENUM } from "./util";

const User = {
  /**
   * Fetches all saved companies for the current user
   * @returns {Promise} Response containing saved companies data
   */
  async getSavedCompanies() {
    return await formatRequest(
      formatUrl(API_ENDPOINTS.USER_SAVED_COMPANIES),
      METHOD_ENUM.GET,
    );
  },

  /**
   * Saves a company to the user's watchlist
   * @param {string|number} companyId - The company ID to save
   * @param {string} companySymbol - The company symbol to save
   * @returns {Promise} Response containing save operation result
   */
  async saveCompany(companyId, companySymbol) {
    return await formatRequest(
      formatUrl(API_ENDPOINTS.USER_SAVED_COMPANIES),
      METHOD_ENUM.POST,
      { companyId, companySymbol },
    );
  },

  /**
   * Removes a company from the user's watchlist
   * @param {string|number} companyId - The company ID to remove
   * @returns {Promise} Response containing unsave operation result
   */
  async unsaveCompany(companyId) {
    return await formatRequest(
      formatUrl(API_ENDPOINTS.USER_SAVED_COMPANIES, { companyId }),
      METHOD_ENUM.DELETE,
    );
  },

  /**
   * Updates the price drop threshold for a saved company
   * @param {string|number} id - The saved company record ID
   * @param {number} priceDropThreshold - The new price drop threshold
   * @returns {Promise} Response containing update operation result
   */
  async updatePriceDropThreshold(id, priceDropThreshold) {
    return await formatRequest(
      formatUrl(API_ENDPOINTS.USER_SAVED_COMPANIES, { id }),
      METHOD_ENUM.PATCH,
      { priceDropThreshold },
    );
  },

  /**
   * Gets the user settings
   * @param {object} settings - The new settings
   * */
  async getUserSettings(userId) {
    return await formatRequest(API_ENDPOINTS.USER_SETTINGS, METHOD_ENUM.GET, {
      userId,
    });
  },

  /**
   * Updates the user settings
   * @param {object} settings - The new settings
   * */
  async updateUserSettings(settings) {
    return await formatRequest(
      formatUrl(API_ENDPOINTS.USER_SETTINGS),
      METHOD_ENUM.PATCH,
      settings,
    );
  },
};

export default User;
