import { SERVER_ADDRESS, options, METHOD_ENUM} from "./util";


const Companies = {
    /**
     * Fetches a block of pages of companies starting from the given page number
     * @param {*} pageNumber - the current page number
     */
    async fetchPage(pageNumber) {
        const url = `${SERVER_ADDRESS}/api/companies?page=${pageNumber}`
        const response =  await (
            await fetch(url, {
              ...options(METHOD_ENUM.GET),
              credentials: "include",
            })
          ).json();
        return response;
    }
}

export {Companies};
