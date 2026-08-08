import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Filter, Star, Sparkles, Search } from "lucide-react";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { JobCategories, JobLocations } from "../assets/assets";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";
import { SlideUp, slideRigth } from "../utils/Animation";
import api from "../utils/api";

function AllJobs() {
  const [jobData, setJobData] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  const {
    jobs, // from context (all public jobs)
    fetchJobsData,
    token,
    userRole,
    searchFilter,
    setSearchFilter,
    isSearched,
    setIsSearched
  } = useContext(AppContext);

  const { category } = useParams();
  const navigate = useNavigate();

  const jobsPerPage = 6;
  const isStudent = token && userRole === "student";

  const [searchInput, setSearchInput] = useState({
    title: "",
    location: "",
    selectedCategories: [],
    selectedLocations: [],
  });

  const [semanticLoading, setSemanticLoading] = useState(false);

  // Fetch AI Recommended Jobs (if student is logged in)
  const fetchRecommendedJobs = async () => {
    if (!isStudent) return;
    setRecommendationsLoading(true);
    try {
      const { data } = await api.get(`/jobs/recommended`);
      setRecommendedJobs(data || []);
    } catch (error) {
      // 400 likely means no resume uploaded yet
      console.log("No recommendations available:", error?.response?.data?.detail);
      setRecommendedJobs([]);
    } finally {
      setRecommendationsLoading(false);
    }
  };

  // Perform Semantic Search via AI if search is triggered
  const performSemanticSearch = async (query) => {
    if (!query) return;
    setSemanticLoading(true);
    try {
      const { data } = await api.get(`/jobs/search?q=${encodeURIComponent(query)}`);
      setJobData(data || []);
    } catch (error) {
      toast.error("Semantic search failed");
    } finally {
      setSemanticLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // If the user came from the home page search bar
      if (isSearched && searchFilter.title) {
        await performSemanticSearch(searchFilter.title);
      } else {
        await fetchJobsData();
      }
      
      await fetchRecommendedJobs();
      setLoading(false);
    };
    fetchData();
  }, [token, userRole, isSearched]);

  // If we aren't doing a semantic search, just use the global jobs array
  useEffect(() => {
    if (isSearched && searchFilter.title) return; // Handled by semantic search

    let filtered = [...jobs];
    if (category && category !== "all") {
      filtered = filtered.filter(
        (job) => (job.job_type || "").toLowerCase() === category.toLowerCase() || 
                 (job.title || "").toLowerCase().includes(category.toLowerCase())
      );
    }
    setJobData(filtered);
    setCurrentPage(1);
  }, [category, jobs, isSearched]);

  // Local filtering for sidebar checkboxes
  useEffect(() => {
    let results = [...jobData];

    if (searchInput.title.trim()) {
      results = results.filter((job) =>
        job.title.toLowerCase().includes(searchInput.title.trim().toLowerCase())
      );
    }
    if (searchInput.location.trim()) {
      results = results.filter((job) =>
        (job.location || "Remote").toLowerCase().includes(searchInput.location.trim().toLowerCase())
      );
    }
    // Simple category mapping (frontend uses categories, backend uses job_type)
    if (searchInput.selectedCategories.length > 0) {
      results = results.filter((job) =>
        searchInput.selectedCategories.some(cat => 
          (job.title || "").toLowerCase().includes(cat.toLowerCase()) || 
          (job.job_type || "").toLowerCase().includes(cat.toLowerCase())
        )
      );
    }
    if (searchInput.selectedLocations.length > 0) {
      results = results.filter((job) =>
        searchInput.selectedLocations.includes(job.location || "Remote")
      );
    }

    setFilteredJobs(results);
    setCurrentPage(1);
  }, [jobData, searchInput]);

  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchInput((prev) => ({ ...prev, [name]: value }));
  };

  const toggleArrayItem = (array, item) => 
    array.includes(item) ? array.filter(i => i !== item) : [...array, item];

  const clearAllFilters = () => {
    setSearchInput({ title: "", location: "", selectedCategories: [], selectedLocations: [] });
    setSearchFilter({ title: "", location: "" });
    setIsSearched(false);
    navigate("/all-jobs/all");
  };

  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);
  const paginatedJobs = useMemo(() => {
    return [...filteredJobs].slice((currentPage - 1) * jobsPerPage, currentPage * jobsPerPage);
  }, [filteredJobs, currentPage]);

  if (loading || semanticLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <div className="flex flex-col items-center">
          <LoaderCircle className="h-10 w-10 text-indigo-600 animate-spin mb-4" />
          <p className="text-gray-500">{semanticLoading ? "AI is analyzing jobs..." : "Loading jobs..."}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50/50 min-h-screen pt-6 pb-20">
        <div className="container mx-auto px-4 md:px-8">
          
          <div className="md:hidden flex justify-end mb-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-50 transition shadow-sm"
            >
              <Filter size={18} />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </button>
          </div>

          <motion.div
            variants={slideRigth(0.5)}
            initial="hidden"
            animate="visible"
            className="flex flex-col md:flex-row md:gap-8 lg:gap-10"
          >
            {/* Sidebar Filters */}
            <div className={`w-full md:w-64 flex-shrink-0 ${showFilters ? "block" : "hidden md:block"}`}>
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm sticky top-24">
                <div className="space-y-6">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Search Role</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="title"
                        value={searchInput.title}
                        onChange={handleSearchChange}
                        placeholder="e.g. Developer"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Location</h2>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        name="location"
                        value={searchInput.location}
                        onChange={handleSearchChange}
                        placeholder="e.g. Remote"
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 mb-3 uppercase tracking-wider">Categories</h2>
                    <ul className="space-y-2.5">
                      {JobCategories.slice(0, 6).map((cat, i) => (
                        <li key={i} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={searchInput.selectedCategories.includes(cat)}
                            onChange={() => setSearchInput(p => ({ ...p, selectedCategories: toggleArrayItem(p.selectedCategories, cat) }))}
                            className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          />
                          <span className="ml-2.5 text-sm text-gray-600">{cat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {searchInput.title || searchInput.selectedCategories.length > 0 || isSearched ? (
                    <button
                      onClick={clearAllFilters}
                      className="w-full py-2 text-sm text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl font-medium transition-colors"
                    >
                      Clear All Filters
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
              
              {/* AI Recommendations */}
              {isStudent && recommendedJobs.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="bg-indigo-100 p-1.5 rounded-lg">
                      <Sparkles className="text-indigo-600 h-5 w-5" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">For You</h2>
                  </div>
                  <p className="text-gray-500 mb-6">AI matched based on your resume profile</p>
                  
                  <motion.div
                    variants={SlideUp(0.3)}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
                  >
                    {recommendedJobs.slice(0, 3).map((job) => (
                      <div key={job.id} onClick={() => navigate(`/apply-job/${job.id}`)} className="bg-white border border-indigo-100 hover:border-indigo-300 rounded-2xl p-5 relative cursor-pointer shadow-sm hover:shadow-md transition-all group overflow-hidden">
                        <div className="absolute top-0 right-0 bg-indigo-600 text-white text-xs px-3 py-1 rounded-bl-xl font-medium shadow-sm z-10">
                          {job.similarity_score ? `${(job.similarity_score * 100).toFixed(0)}% Match` : 'Top Match'}
                        </div>
                        <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:scale-150 transition-transform duration-500">
                          <Sparkles className="w-32 h-32 text-indigo-600" />
                        </div>
                        
                        <h3 className="font-bold text-gray-900 text-lg mb-1 pr-16 line-clamp-1 group-hover:text-indigo-600 transition-colors">{job.title}</h3>
                        <p className="text-sm text-gray-500 mb-4 capitalize">{job.job_type} • {job.is_remote ? "Remote" : (job.location || "On-site")}</p>
                        
                        <div className="flex flex-wrap gap-1.5 mt-auto">
                          {(job.skills_required || []).slice(0, 3).map(s => (
                            <span key={s} className="px-2 py-1 bg-indigo-50/80 text-indigo-700 text-xs rounded-md font-medium">{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </div>
              )}

              {/* All Jobs */}
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 capitalize">
                    {isSearched ? "Search Results" : category === "all" ? "All Openings" : `${category.replace("-", " ")}`}
                  </h1>
                  <p className="text-gray-500 mt-1">
                    {filteredJobs.length} {filteredJobs.length === 1 ? "job" : "jobs"} available
                  </p>
                </div>
              </div>

              <motion.div
                variants={SlideUp(0.5)}
                initial="hidden"
                animate="visible"
                className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5"
              >
                {paginatedJobs.length > 0 ? (
                  paginatedJobs.map((job) => (
                    // We modify JobCard to handle the new job schema inside it, but pass the job object
                    <JobCard key={job.id} job={job} />
                  ))
                ) : (
                  <div className="col-span-full text-center bg-white p-12 border border-dashed border-gray-300 rounded-2xl">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Search className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No matches found</h3>
                    <p className="text-gray-500 mb-6">Try adjusting your filters or search query.</p>
                    <button
                      onClick={clearAllFilters}
                      className="px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 font-medium transition-colors"
                    >
                      Clear Filters
                    </button>
                  </div>
                )}
              </motion.div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-12 mb-8">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 text-gray-700 bg-white shadow-sm"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div className="flex gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-10 h-10 rounded-xl text-sm font-medium transition-all ${
                          currentPage === i + 1
                            ? "bg-indigo-600 text-white shadow-sm shadow-indigo-200"
                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-30 text-gray-700 bg-white shadow-sm"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default AllJobs;
