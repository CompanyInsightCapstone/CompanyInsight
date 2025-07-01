import {
    SERVER_ADDRESS,
    options,
    METHOD_ENUM,
  } from "./util";


const User = {
    async getSavedCompanies(userId) {
        const url = `${SERVER_ADDRESS}/api/user/companies/save`
        const urlParams = new URLSearchParams({userId: userId});
        return await fetch(url + "?" + urlParams, options(METHOD_ENUM.GET)).then(res => res.json());
    },

    async saveCompany(userId, companyId, companySymbol) {
        const url = `${SERVER_ADDRESS}/api/user/companies/save`
        const data = {userId, companyId, companySymbol}
        return await fetch(url, options(METHOD_ENUM.POST, data)).then(res => res.json());
    },
    async unsaveCompany(userId, companyId) {
        const url = `${SERVER_ADDRESS}/api/user/companies/save`
        const urlParams = new URLSearchParams({userId: userId, companyId: companyId});
        return await fetch(url + "?" + urlParams, options(METHOD_ENUM.DELETE)).then(res => res.json());
    },
}

export default User;
