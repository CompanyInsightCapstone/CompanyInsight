import { createContext, useEffect, useState, useMemo } from "react";
import User from "../api/user";

export const UserContext = createContext();

const responseMessage = {
  SAVED: "Saved",
  UNSAVED: "Unsaved",
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [savedCompanies, setSavedCompanies] = useState([]);

  const savedCompanyMap = useMemo(() => {
    const map = new Map();
    savedCompanies.forEach((company) => {
      map.set(company.companyId, company);
    });
    return map;
  }, [savedCompanies]);

  const isCompanySaved = (companyId) => {
    return savedCompanyMap.has(companyId);
  };

  async function fetchUserSavedCompanies() {
    if (user && user.id) {
      const response = await User.getSavedCompanies();
      if (response && response.savedCompanies) {
        setSavedCompanies(response.savedCompanies);
      }
    }
  }

  async function saveCompany(companyId, companySymbol) {
    if (!user || !user.id) return;
    try {
      const response = await User.saveCompany(companyId, companySymbol);
      if (response && response.message === responseMessage.SAVED) {
        fetchUserSavedCompanies();
      }
      return response;
    } catch (error) {
      return { error: error.message };
    }
  }

  async function unsaveCompany(companyId) {
    if (!user || !user.id) return;
    try {
      const response = await User.unsaveCompany(companyId);
      if (response && response.message === responseMessage.UNSAVED) {
        fetchUserSavedCompanies();
      }
      return response;
    } catch (error) {
      return { error: error.message };
    }
  }

  useEffect(() => {
    if (user) {
      fetchUserSavedCompanies();
    }
  }, [user]);

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        savedCompanies,
        isCompanySaved,
        saveCompany,
        unsaveCompany,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
