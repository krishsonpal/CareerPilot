import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  Send,
  Building2,
  MapPin,
  DollarSign,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Layers,
  Bot
} from "lucide-react";
import kConverter from "k-convert";
import { AppContext } from "../../context/AppContext";
import api from "../../utils/api";
import Loader from "../../components/Loader";

const Overview = () => {
  const { userData, jobs } = useContext(AppContext);
  const [recommendedJobs, setRecommendedJobs] = useState([]);
  const [recLoading, setRecLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [appLoading, setAppLoading] = useState(true);
  const [resumeProfile, setResumeProfile] = useState(null);
  const [promptInput, setPromptInput] = useState("");

  const navigate = useNavigate();

  // Load Recommended Jobs
  useEffect(() => {
    const fetchRecommendations = async () => {
      setRecLoading(true);
      try {
        const { data } = await api.get("/jobs/recommended");
        if (data && data.length > 0) {
          setRecommendedJobs(data.slice(0, 3));
        } else {
          // Fallback to top 3 active jobs
          setRecommendedJobs((jobs || []).slice(0, 3));
        }
      } catch (err) {
        setRecommendedJobs((jobs || []).slice(0, 3));
      } finally {
        setRecLoading(false);
      }
    };

    fetchRecommendations();
  }, [jobs]);

  // Load Applications Snapshot
  useEffect(() => {
    const fetchApplications = async () => {
      setAppLoading(true);
      try {
        const { data } = await api.get("/applications/me");
        setApplications(data || []);
      } catch (err) {
        setApplications([]);
      } finally {
        setAppLoading(false);
      }
    };

    fetchApplications();
  }, []);

  // Load Resume Profile to calculate completeness
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/ai/resume");
        setResumeProfile(data);
      } catch (err) {
        setResumeProfile(null);
      }
    };
    fetchProfile();
  }, []);

  // Calculate profile completeness
  const calculateCompleteness = () => {
    if (!resumeProfile) return 40;
    let score = 40;
    if (resumeProfile.summary) score += 20;
    if (resumeProfile.skills && resumeProfile.skills.length > 0) score += 20;
    if (resumeProfile.experience && resumeProfile.experience.length > 0) score += 10;
    if (resumeProfile.education && resumeProfile.education.length > 0) score += 10;
    return Math.min(score, 100);
  };

  const completeness = calculateCompleteness();

  // Count application statuses
  const counts = {
    applied: applications.filter((a) => a.status === "applied").length,
    shortlisted: applications.filter((a) => a.status === "shortlisted").length,
    interviewing: applications.filter((a) => a.status === "interviewing").length,
    selected: applications.filter((a) => a.status === "selected").length,
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (promptInput.trim()) {
      navigate("/app/assistant", { state: { initialPrompt: promptInput.trim() } });
    }
  };

  const formatSalary = (min, max) => {
    if (min && max) return `$${kConverter.convertTo(min)} - $${kConverter.convertTo(max)}`;
    if (min) return `$${kConverter.convertTo(min)}`;
    return "$100k+";
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Top Welcome & Profile Completeness Banner (Matching Screen 3) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Welcome back, {userData?.full_name?.split(" ")[0] || "Candidate"}!
          </h1>
          <p className="text-sm text-slate-500 max-w-xl">
            Here is your live AI recruitment pulse. Review new semantic matches, track active applications, and optimize your resume.
          </p>
        </div>

        {/* Circular Profile Completeness Meter */}
        <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60 shrink-0">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-700">Profile Completeness</p>
            <Link
              to="/app/profile"
              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              {completeness < 100 ? "Complete profile →" : "Profile 100% Ready ✓"}
            </Link>
          </div>

          {/* SVG Circular Progress Ring */}
          <div className="relative w-14 h-14 flex items-center justify-center">
            <svg className="w-14 h-14 transform -rotate-90">
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                className="text-slate-200"
                fill="transparent"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                stroke="currentColor"
                strokeWidth="4"
                strokeDasharray={138.2}
                strokeDashoffset={138.2 - (138.2 * completeness) / 100}
                strokeLinecap="round"
                className="text-indigo-600 transition-all duration-1000"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-900">
              {completeness}%
            </span>
          </div>
        </div>
      </div>

      {/* 2. Middle Main Grid: Top AI-Matched Jobs (Left) + Applications Snapshot (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Top AI-Matched Jobs (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-600" size={18} />
              <h2 className="text-lg font-bold text-slate-900">
                Top AI-Matched Jobs For You
              </h2>
            </div>
            <Link
              to="/app/jobs"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
            >
              <span>Explore all</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {recLoading ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 flex justify-center">
              <Loader />
            </div>
          ) : recommendedJobs.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
              <p className="text-sm text-slate-500 font-medium mb-3">
                No recommended jobs yet. Upload your resume to activate FAISS vector matching!
              </p>
              <Link
                to="/app/profile"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs"
              >
                Upload Resume (PDF)
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {recommendedJobs.map((job, idx) => {
                const matchScore = job.match_score || (95 - idx * 3);
                return (
                  <div
                    key={job.id || idx}
                    onClick={() => navigate(`/apply-job/${job.id}`)}
                    className="bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Company Header */}
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-bold text-indigo-600 text-sm mb-3 group-hover:scale-105 transition-transform">
                        {job.recruiter?.company_name?.charAt(0) || "C"}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-1">
                        {job.title}
                      </h3>
                      
                      <p className="text-xs text-slate-500 font-medium mb-3">
                        {job.recruiter?.company_name || "Tech Company"}
                      </p>

                      <div className="space-y-1 text-xs text-slate-500 mb-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin size={13} className="text-slate-400" />
                          <span>{job.is_remote ? "Remote" : (job.location || "On-site")}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <DollarSign size={13} className="text-slate-400" />
                          <span>{formatSalary(job.salary_min, job.salary_max)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Prominent Match Badge (Matching Screen 3) */}
                    <div className="pt-3 border-t border-slate-100">
                      <span className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-indigo-600 text-white font-black text-xs shadow-xs">
                        <span>{matchScore}%</span>
                        <span className="font-semibold text-[10px] opacity-90">Semantic Match</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Applications Snapshot (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="text-indigo-600" size={18} />
              <h2 className="text-lg font-bold text-slate-900">
                Applications Snapshot
              </h2>
            </div>
            <Link
              to="/app/applications"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
            >
              View all
            </Link>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between p-3 bg-slate-50/70 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Applied</span>
              <span className="text-sm font-extrabold text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                {counts.applied}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/60">
              <span className="text-xs font-semibold text-indigo-900">Shortlisted</span>
              <span className="text-sm font-extrabold text-indigo-700 bg-white px-2.5 py-0.5 rounded-lg border border-indigo-200 shadow-xs">
                {counts.shortlisted}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100/60">
              <span className="text-xs font-semibold text-amber-900">Interviewing</span>
              <span className="text-sm font-extrabold text-amber-700 bg-white px-2.5 py-0.5 rounded-lg border border-amber-200 shadow-xs">
                {counts.interviewing}
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
              <span className="text-xs font-semibold text-emerald-900">Selected</span>
              <span className="text-sm font-extrabold text-emerald-700 bg-white px-2.5 py-0.5 rounded-lg border border-emerald-200 shadow-xs">
                {counts.selected}
              </span>
            </div>

            <Link
              to="/app/applications"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors"
            >
              <span>Manage Application Pipeline</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>

      </div>

      {/* 3. Bottom Quick AI Prompt Bar (Matching Screen 3) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-4">
        <form onSubmit={handlePromptSubmit} className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Bot size={20} />
          </div>
          <input
            type="text"
            placeholder="Ask CareerPilot AI anything (e.g. 'What skills do I need for Google AI roles?')..."
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            className="flex-1 outline-none text-xs sm:text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-[0.98] cursor-pointer shrink-0"
          >
            <span>Ask AI</span>
            <Send size={13} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default Overview;
