import { SERVER_ADDRESS, options, METHOD_ENUM} from "./util";


const Companies = {
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
