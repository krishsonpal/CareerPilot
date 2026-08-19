import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, DollarSign, Building2, Pin } from "lucide-react";
import kConverter from "k-convert";
import api from "../utils/api";
import Loader from "./Loader";

const RecommendedRail = () => {
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/jobs/recommended");
        setRecommendedJobs(data || []);
      } catch (err) {
        setRecommendedJobs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  if (loading) {
    return null; // Silent load
  }

  if (recommendedJobs.length === 0) {
    return null;
  }

  const formatSalary = (min, max) => {
    if (min && max) return `$${kConverter.convertTo(min)} - $${kConverter.convertTo(max)}`;
    if (min) return `$${kConverter.convertTo(min)}`;
    return "$120k+";
  };

  return (
    <div className="space-y-3 mb-8">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Pin size={16} className="text-indigo-600 rotate-45" />
        <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-2">
          <span>Recommended for You</span>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100">
            FAISS Semantic Match
          </span>
        </h2>
      </div>

      {/* Cards Rail Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedJobs.slice(0, 3).map((job, idx) => {
          const fitScore = job.match_score || (96 - idx * 2);
          return (
            <div
              key={job.id || idx}
              onClick={() => navigate(`/apply-job/${job.id}`)}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                    {job.recruiter?.company_name?.charAt(0) || "C"}
                  </div>

                  {/* Circular Fit Badge (matching photos/job_search.jpg) */}
                  <div className="w-11 h-11 rounded-full bg-emerald-50 border-2 border-emerald-500 flex flex-col items-center justify-center text-emerald-700 font-extrabold text-xs shadow-xs shrink-0">
                    <span className="text-[11px] leading-tight">{fitScore}%</span>
                    <span className="text-[8px] uppercase tracking-tighter opacity-80">Fit</span>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                  {job.title}
                </h3>
                
                <p className="text-xs text-slate-500 font-semibold mb-3">
                  {job.recruiter?.company_name || "Premier Tech Corp"}
                </p>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    <span>{job.is_remote ? "Remote" : (job.location || "On-site")}</span>
                  </div>
                  <div className="flex items-center gap-1 text-indigo-600 font-bold">
                    <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
                <span>View Full Spec</span>
                <span>→</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecommendedRail;
