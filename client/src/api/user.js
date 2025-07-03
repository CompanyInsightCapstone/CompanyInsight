import { UserProvider } from "../contexts/UserContext";
import { SERVER_ADDRESS, options, METHOD_ENUM } from "./util";

const User = {
  async getSavedCompanies() {
    const url = `${SERVER_ADDRESS}/api/user/companies/save`;
    return await fetch(url, {
      ...options(METHOD_ENUM.GET),
      credentials: "include",
    }).then((res) => res.json());
  },

  async saveCompany(companyId, companySymbol) {
    const url = `${SERVER_ADDRESS}/api/user/companies/save`;
    const data = { companyId, companySymbol };
    return await fetch(url, {
      ...options(METHOD_ENUM.POST, data),
      credentials: "include",
    }).then((res) => res.json());
  },

  async unsaveCompany(companyId) {
    const url = `${SERVER_ADDRESS}/api/user/companies/save`;
    const urlParams = new URLSearchParams({ companyId: companyId });
    return await fetch(url + "?" + urlParams, {
      ...options(METHOD_ENUM.DELETE),
      credentials: "include",
    }).then((res) => res.json());
  },

  async updatePriceDropThreshold(id, priceDropThreshold) {
    const url = `${SERVER_ADDRESS}/api/user/companies/save`;
    const urlParams = new URLSearchParams({ id: id });
    return await fetch(url + "?" + urlParams, {
      ...options(METHOD_ENUM.PATCH, { priceDropThreshold }),
      credentials: "include",
    }).then((res) => res.json());
  },
};

export default User;
