import { useEffect, useState, createContext } from "react";
import { SERVER_ADDRESS, options, METHOD_ENUM  } from "../api/util";

export const CompanyListContext = createContext();

export default function CompanyListProvider({ children }) {

  const [companies, setCompanies] = useState([]);


  const updateCompanyList = (newList) => {
    setCompanies(newList);
  }


  useEffect(() => {
    const fetchCompanies = async () => {
       const response = await fetch(`${SERVER_ADDRESS}/api/companies`, {
              ...options(METHOD_ENUM.GET),
              credentials: "include",
            });
        const data = await response.json();
        setCompanies(data.companies);
    };
    fetchCompanies();
  }, []);

  return (
    <CompanyListContext.Provider value={{ companies, updateCompanyList }}>
      {children}
    </CompanyListContext.Provider>
  );
}
