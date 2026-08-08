import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import api from "../utils/api";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  // Global States
  const [searchFilter, setSearchFilter] = useState({ title: "", location: "" });
  const [isSearched, setIsSearched] = useState(false);
  
  const [jobs, setJobs] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);

  // Authentication States (Unified for Student & Recruiter)
  // role can be "student" or "recruiter"
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [userRole, setUserRole] = useState(localStorage.getItem("role"));
  const [userData, setUserData] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Application / ATS States
  const [userApplications, setUserApplications] = useState([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  // ------------------------------------------------------------------------
  // Effects & Lifecycle
  // ------------------------------------------------------------------------

  // Update localStorage when token/role changes
  useEffect(() => {
    if (token && userRole) {
      localStorage.setItem("token", token);
      localStorage.setItem("role", userRole);
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
    }
  }, [token, userRole]);

  // Load User Data & Initial Data on Mount or Token Change
  useEffect(() => {
    const initApp = async () => {
      setIsAuthLoading(true);
      if (token) {
        await fetchUserProfile();
      } else {
        setUserData(null);
      }
      setIsAuthLoading(false);
      // Fetch public jobs regardless of auth
      fetchJobsData();
    };
    initApp();
  }, [token]);


  // ------------------------------------------------------------------------
  // API Calls
  // ------------------------------------------------------------------------

  const fetchUserProfile = async () => {
    try {
      const { data } = await api.get("/auth/me");
      setUserData(data);
    } catch (error) {
      console.error("Failed to fetch user profile", error);
      // If 401, the interceptor will clear the token and reload
    }
  };

  const fetchJobsData = async () => {
    setJobLoading(true);
    try {
      // Use the public jobs endpoint
      const { data } = await api.get("/jobs");
      setJobs(data || []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch jobs.");
    } finally {
      setJobLoading(false);
    }
  };

  const fetchUserApplications = async () => {
    if (!token || userRole !== "student") return;
    try {
      setApplicationsLoading(true);
      const { data } = await api.get("/applications/me");
      setUserApplications(data || []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch applications");
    } finally {
      setApplicationsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    setUserData(null);
    toast.success("Logged out successfully");
  };

  // ------------------------------------------------------------------------
  // Context Value
  // ------------------------------------------------------------------------
  const value = {
    // Search
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched,

    // Jobs
    jobs,
    setJobs,
    jobLoading,
    fetchJobsData,

    // Authentication (Unified)
    token,
    setToken,
    userRole,
    setUserRole,
    userData,
    setUserData,
    isAuthLoading,
    fetchUserProfile,
    logout,
    
    // Legacy support (to avoid breaking current pages immediately during migration)
    userToken: userRole === "student" ? token : null,
    setUserToken: (t) => { setToken(t); setUserRole("student"); },
    companyToken: userRole === "recruiter" ? token : null,
    setCompanyToken: (t) => { setToken(t); setUserRole("recruiter"); },
    isLogin: !!token && userRole === "student",
    isCompanyLogin: !!token && userRole === "recruiter",
    companyData: userRole === "recruiter" ? userData : null,

    // Applications
    userApplication: userApplications, // Keep singular naming for legacy component compatibility
    applicationsLoading,
    fetchUserApplication: fetchUserApplications
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
