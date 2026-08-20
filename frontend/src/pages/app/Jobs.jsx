import React, { useContext, useState, useMemo } from "react";
import { Search, Sparkles, Filter, X, Briefcase, SlidersHorizontal } from "lucide-react";
import { AppContext } from "../../context/AppContext";
import RecommendedRail from "../../components/RecommendedRail";
import JobFilters from "../../components/JobFilters";
import JobCard from "../../components/JobCard";
import Loader from "../../components/Loader";

const Jobs = () => {
  const { jobs, jobLoading, searchFilter, setSearchFilter, isSearched, setIsSearched } =
    useContext(AppContext);

  const [searchQuery, setSearchQuery] = useState(searchFilter?.title || "");
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedRoleType, setSelectedRoleType] = useState("all");
  const [isRemoteOnly, setIsRemoteOnly] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Compute filtered jobs
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((job) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = job.title?.toLowerCase().includes(q);
        const compMatch = job.recruiter?.company_name?.toLowerCase().includes(q);
        const skillMatch = (job.skills_required || []).some((s) => s.toLowerCase().includes(q));
        if (!titleMatch && !compMatch && !skillMatch) return false;
      }

      // 2. Role Type
      if (selectedRoleType !== "all" && job.job_type !== selectedRoleType) {
        return false;
      }

      // 3. Remote Only
      if (isRemoteOnly && !job.is_remote) {
        return false;
      }

      // 4. Categories
      if (selectedCategories.length > 0 && !selectedCategories.includes(job.category)) {
        return false;
      }

      // 5. Locations
      if (selectedLocations.length > 0 && !selectedLocations.includes(job.location)) {
        return false;
      }

      return true;
    });
  }, [jobs, searchQuery, selectedCategories, selectedLocations, selectedRoleType, isRemoteOnly]);

  const handleResetFilters = () => {
    setSelectedCategories([]);
    setSelectedLocations([]);
    setSelectedRoleType("all");
    setIsRemoteOnly(false);
    setSearchQuery("");
    setSearchFilter({ title: "", location: "" });
    setIsSearched(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Natural Language Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Briefcase className="text-primary" size={26} />
            <span>Semantic Job Discovery</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Search 100,000+ positions ranked via FAISS multi-vector cosine similarity.
          </p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          className="lg:hidden inline-flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-xl text-xs font-bold text-foreground"
        >
          <SlidersHorizontal size={14} />
          <span>Filters ({selectedCategories.length + selectedLocations.length})</span>
        </button>
      </div>

      {/* 2. Pinned Top FAISS Recommended Rail */}
      <RecommendedRail recommendedJobs={jobs} />

      {/* 3. Search Bar Container */}
      <div className="bg-card rounded-2xl border border-border p-3 shadow-xs flex items-center gap-2">
        <div className="flex-1 flex items-center px-3">
          <Search size={18} className="text-primary mr-3 shrink-0" />
          <input
            type="text"
            placeholder="Search by job title, specific tech skills (e.g. Python, Docker, PyTorch), or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs sm:text-sm text-foreground bg-transparent outline-none placeholder:text-muted-foreground font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-muted-foreground hover:text-foreground p-1"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* 4. Main 2-Column Area: Left Filters Sidebar + Right Job Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Filter Sidebar (3 cols on lg) */}
        <div className={`lg:col-span-3 ${mobileFilterOpen ? "block" : "hidden lg:block"}`}>
          <JobFilters
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedLocations={selectedLocations}
            setSelectedLocations={setSelectedLocations}
            selectedRoleType={selectedRoleType}
            setSelectedRoleType={setSelectedRoleType}
            isRemoteOnly={isRemoteOnly}
            setIsRemoteOnly={setIsRemoteOnly}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Right Job Cards Feed (9 cols on lg) */}
        <div className="lg:col-span-9 space-y-4">
          
          {/* Results Counter Bar */}
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Showing {filteredJobs.length} matching positions
            </span>
          </div>

          {jobLoading ? (
            <div className="py-20 flex justify-center bg-card rounded-2xl border border-border">
              <Loader />
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="bg-card rounded-2xl border border-border p-12 text-center max-w-md mx-auto space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <Search size={22} />
              </div>
              <h3 className="text-base font-bold text-foreground">No matching positions found</h3>
              <p className="text-xs text-muted-foreground">
                Try adjusting your search query or reset the filter facets.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

export default Jobs;
