import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, MapPin, Sparkles, Filter, ChevronLeft, ChevronRight, Briefcase } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import RecommendedRail from "../../components/RecommendedRail";
import JobFilters from "../../components/JobFilters";
import JobCard from "../../components/JobCard";
import Loader from "../../components/Loader";
import api from "../../utils/api";

const Jobs = () => {
  const { jobs, jobLoading, fetchJobsData, searchFilter, isSearched } = useContext(AppContext);
  const [searchParams, setSearchParams] = useSearchParams();

  const [semanticResults, setSemanticResults] = useState(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchFilter?.title || "");
  const [locationQuery, setLocationQuery] = useState(searchFilter?.location || "");
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 6;

  // Facet Filters State
  const [filters, setFilters] = useState({
    categories: [],
    experienceLevels: [],
    selectedSalaryIdx: null,
    jobTypes: [],
    remoteOnly: false,
  });

  const SALARY_RANGES = [
    { min: 60000, max: 100000 },
    { min: 100000, max: 130000 },
    { min: 130000, max: 160000 },
    { min: 160000, max: 999999 },
  ];

  // Perform Semantic Vector Search
  const performSearch = async (query) => {
    if (!query?.trim()) {
      setSemanticResults(null);
      return;
    }
    setSemanticLoading(true);
    try {
      const { data } = await api.get(`/jobs/search?q=${encodeURIComponent(query.trim())}`);
      setSemanticResults(data || []);
    } catch (err) {
      setSemanticResults(null);
    } finally {
      setSemanticLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
    setCurrentPage(1);
  };

  // Initial load
  useEffect(() => {
    fetchJobsData();
    if (searchFilter?.title) {
      performSearch(searchFilter.title);
    }
  }, []);

  // Filtered Job List
  const displayJobs = useMemo(() => {
    const baseList = semanticResults !== null ? semanticResults : jobs || [];

    return baseList.filter((job) => {
      // 1. Location filter
      if (locationQuery.trim()) {
        const locLower = locationQuery.toLowerCase();
        const jobLoc = (job.location || "").toLowerCase();
        const isRem = job.is_remote;
        if (!jobLoc.includes(locLower) && !(locLower.includes("remote") && isRem)) {
          return false;
        }
      }

      // 2. Remote only
      if (filters.remoteOnly && !job.is_remote) {
        return false;
      }

      // 3. Category
      if (filters.categories.length > 0) {
        const titleAndSkills = `${job.title} ${(job.skills_required || []).join(" ")}`.toLowerCase();
        const matchesCategory = filters.categories.some((cat) =>
          titleAndSkills.includes(cat.toLowerCase())
        );
        if (!matchesCategory) return false;
      }

      // 4. Experience Level
      if (filters.experienceLevels.length > 0) {
        if (!filters.experienceLevels.includes(job.experience_level)) {
          return false;
        }
      }

      // 5. Salary Range
      if (filters.selectedSalaryIdx !== null) {
        const targetRange = SALARY_RANGES[filters.selectedSalaryIdx];
        if (targetRange) {
          const min = job.salary_min || 0;
          const max = job.salary_max || min;
          if (max < targetRange.min || min > targetRange.max) {
            return false;
          }
        }
      }

      // 6. Job Type
      if (filters.jobTypes.length > 0) {
        if (!filters.jobTypes.includes(job.job_type)) {
          return false;
        }
      }

      return true;
    });
  }, [jobs, semanticResults, locationQuery, filters]);

  // Pagination
  const totalPages = Math.ceil(displayJobs.length / jobsPerPage) || 1;
  const paginatedJobs = displayJobs.slice(
    (currentPage - 1) * jobsPerPage,
    currentPage * jobsPerPage
  );

  const resetFilters = () => {
    setFilters({
      categories: [],
      experienceLevels: [],
      selectedSalaryIdx: null,
      jobTypes: [],
      remoteOnly: false,
    });
    setSearchQuery("");
    setLocationQuery("");
    setSemanticResults(null);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Semantic Search Bar */}
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="text-indigo-600" size={26} />
            <span>Discover & Match Jobs</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Search with natural language or filter by exact stack requirements.
          </p>
        </div>

        {/* Search Form Pill */}
        <form
          onSubmit={handleSearchSubmit}
          className="bg-white rounded-2xl p-2 sm:p-2.5 border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center gap-2"
        >
          <div className="flex items-center px-3.5 py-2 w-full flex-1">
            <Search size={18} className="text-indigo-600 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Search by role, skills, or query (e.g. Remote Python FAISS Backend)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full outline-none text-xs sm:text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
            />
          </div>

          <div className="hidden sm:block w-px h-7 bg-slate-200 shrink-0" />

          <div className="flex items-center px-3.5 py-2 w-full sm:w-64">
            <MapPin size={18} className="text-rose-500 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Location or Remote"
              value={locationQuery}
              onChange={(e) => setLocationQuery(e.target.value)}
              className="w-full outline-none text-xs sm:text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all active:scale-[0.98] text-xs sm:text-sm shrink-0 cursor-pointer"
          >
            {semanticLoading ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {/* 2. Top Pinned Recommended Rail (FAISS Semantic Match) */}
      <RecommendedRail />

      {/* 3. Main 2-Column Area: Left Filters + Right Job Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Facet Filters (4 cols on lg) */}
        <div className="lg:col-span-4">
          <JobFilters
            filters={filters}
            setFilters={setFilters}
            onReset={resetFilters}
          />
        </div>

        {/* Right Column: Job Cards Grid & Pagination (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          
          <div className="flex items-center justify-between px-1">
            <p className="text-xs sm:text-sm font-bold text-slate-700">
              Showing <span className="text-indigo-600 font-black">{displayJobs.length}</span> positions
            </p>
            {semanticResults && (
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 flex items-center gap-1">
                <Sparkles size={12} /> Semantic Search Active
              </span>
            )}
          </div>

          {jobLoading || semanticLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 flex justify-center">
              <Loader />
            </div>
          ) : paginatedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-10 text-center space-y-3">
              <p className="text-sm font-bold text-slate-700">No jobs match your current filters.</p>
              <p className="text-xs text-slate-400">Try broadening your search query or resetting filters.</p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginatedJobs.map((job, idx) => (
                  <JobCard key={job.id || idx} job={job} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => {
                      setCurrentPage((p) => Math.max(p - 1, 1));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-xs"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <div className="flex items-center gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setCurrentPage(i + 1);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                          currentPage === i + 1
                            ? "bg-indigo-600 text-white shadow-xs"
                            : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => {
                      setCurrentPage((p) => Math.min(p + 1, totalPages));
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 cursor-pointer shadow-xs"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Jobs;
