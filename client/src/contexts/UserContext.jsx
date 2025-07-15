import { createContext, useState, useMemo } from "react";
import {
  API_ENDPOINTS,
  formatUrl,
  formatRequest,
  METHOD_ENUM,
} from "../api/util";
import { useQuery } from "@tanstack/react-query";
import User from "../api/user";

export const UserContext = createContext();

const responseMessage = {
  SAVED: "Saved",
  UNSAVED: "Unsaved",
};

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userSettings, setUserSettings] = useState({});
  const [savedCompanies, setSavedCompanies] = useState([]);

  const { data } = useQuery({
    queryKey: ["check-session"],
    queryFn: async () => {
      const response = await formatRequest(
        formatUrl(API_ENDPOINTS.CHECK_SESSION),
        METHOD_ENUM.GET,
      );
      if (!response.ok) {
        throw new Error("Failed to check session");
      }
      setUser(response);
      return response;
    },
    retry: 1,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000,
  });

  const { savedData, isLoading, refetch } = useQuery({
    queryKey: ["saved-companies", user?.id],
    queryFn: async () => {
      const response = await formatRequest(
        formatUrl(API_ENDPOINTS.USER_SAVED_COMPANIES),
        METHOD_ENUM.GET,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch saved companies");
      }

      setSavedCompanies(response.savedCompanies);
      return response.savedCompanies || [];
    },
    enabled: !!user?.id,
    retry: 0,
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

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

  return (
    <UserContext.Provider
      value={{
        user,
        setUser,
        userSettings,
        setUserSettings,
        savedCompanies,
        setSavedCompanies,
        isCompanySaved,
        saveCompany,
        unsaveCompany,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
