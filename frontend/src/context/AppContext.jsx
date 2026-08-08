import axios from "axios";
import { createContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

  const [searchFilter, setSearchFilter] = useState({ title: "", location: "" });
  const [isSearched, setIsSearched] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobLoading, setJobLoading] = useState(false);

  const [userToken, setUserToken] = useState(localStorage.getItem("userToken"));
  const [userData, setUserData] = useState(null);
  const [userDataLoading, setUserDataLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(!!userToken);

  // Initialize user data from localStorage on mount
  useEffect(() => {
    const storedUserData = localStorage.getItem("userData");
    if (storedUserData && userToken) {
      setUserData(JSON.parse(storedUserData));
      console.log("Loaded user data from localStorage:", JSON.parse(storedUserData));
    }
  }, []);
  const [userApplication, setUserApplication] = useState(null);
  const [applicationsLoading, setApplicationsLoading] = useState(false);

  const [companyToken, setCompanyToken] = useState(
    localStorage.getItem("companyToken")
  );
  const [companyData, setCompanyData] = useState(null);
  const [isCompanyLogin, setIsCompanyLogin] = useState(!!companyToken);
  const [companyLoading, setIsCompanyLoading] = useState(false);

  // Initialize company data from localStorage on mount
  useEffect(() => {
    const storedCompanyData = localStorage.getItem("companyData");
    if (storedCompanyData && companyToken) {
      setCompanyData(JSON.parse(storedCompanyData));
      console.log("Loaded company data from localStorage:", JSON.parse(storedCompanyData));
    }
  }, []);

  useEffect(() => {
    if (userToken) {
      localStorage.setItem("userToken", userToken);
    } else {
      localStorage.removeItem("userToken");
    }
  }, [userToken]);

  useEffect(() => {
    if (companyToken) {
      localStorage.setItem("companyToken", companyToken);
    } else {
      localStorage.removeItem("companyToken");
    }
  }, [companyToken]);

  const fetchUserData = async () => {
    if (!userToken) return;
    setUserDataLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/student/user-info`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      if (data) {
        setUserData({
          student_id: data.student_id,
          message: data.message,
          has_resume_summary: !!data.has_resume_summary
        });
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.detail || "Failed to fetch user data."
      );
    } finally {
      setUserDataLoading(false);
    }
  };

  const fetchCompanyData = async () => {
    if (!companyToken) return;
    setIsCompanyLoading(true);
    try {
      // For now, we'll store company data in localStorage since FastAPI doesn't have a company data endpoint yet
      const storedCompanyData = localStorage.getItem("companyData");
      if (storedCompanyData) {
        setCompanyData(JSON.parse(storedCompanyData));
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.detail || "Failed to fetch company data."
      );
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const fetchJobsData = async () => {
    setJobLoading(true);
    try {
      const { data } = await axios.get(`${backendUrl}/company/internships`);
      if (data.internships) {
        setJobs(data.internships);
      } else {
        toast.error("Failed to fetch internships");
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch internships.");
    } finally {
      setJobLoading(false);
    }
  };

  const fetchUserApplication = async () => {
    try {
      setApplicationsLoading(true);
      // For now, we'll store applications in localStorage since FastAPI doesn't have this endpoint yet
      const storedApplications = localStorage.getItem("userApplications");
      if (storedApplications) {
        setUserApplication(JSON.parse(storedApplications));
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch applications");
    } finally {
      setApplicationsLoading(false);
    }
  };

  useEffect(() => {
    if (localStorage.getItem("userToken")) {
      fetchUserApplication();
    }
  }, []);

  useEffect(() => {
    fetchJobsData();
  }, []);

  useEffect(() => {
    if (userToken) {
      setIsLogin(true);
      // Load user data from localStorage first
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        setUserData(JSON.parse(storedUserData));
      }
      // Optionally fetch additional data from server
      // fetchUserData();
    } else {
      setUserData(null);
      setIsLogin(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (companyToken) {
      setIsCompanyLogin(true);
      // Load company data from localStorage first
      const storedCompanyData = localStorage.getItem("companyData");
      if (storedCompanyData) {
        setCompanyData(JSON.parse(storedCompanyData));
      }
      // Optionally fetch additional data from server
      // fetchCompanyData();
    } else {
      setCompanyData(null);
      setIsCompanyLogin(false);
    }
  }, [companyToken]);

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

    // Backend
    backendUrl,

    // User
    userToken,
    setUserToken,
    userData,
    setUserData,
    userDataLoading,
    isLogin,
    setIsLogin,
    fetchUserData,

    // Company
    companyToken,
    setCompanyToken,
    companyData,
    setCompanyData,
    isCompanyLogin,
    setIsCompanyLogin,
    fetchCompanyData,
    companyLoading,
    userApplication,
    applicationsLoading,
    fetchUserApplication
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
