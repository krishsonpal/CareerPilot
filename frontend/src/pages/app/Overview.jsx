import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  Bot,
  Briefcase,
  FileCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Send,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import { AppContext } from "../../context/AppContext";
import JobCard from "../../components/JobCard";
import Loader from "../../components/Loader";

const Overview = () => {
  const { userData, jobs, jobLoading, userApplication, fetchUserApplication } = useContext(AppContext);
  const [quickPrompt, setQuickPrompt] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserApplication();
  }, []);

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (!quickPrompt.trim()) return;
    navigate("/app/assistant", { state: { initialPrompt: quickPrompt } });
  };

  const applicationsCount = userApplication?.length || 0;
  const shortlistedCount = userApplication?.filter((a) => a.status === "shortlisted" || a.status === "interviewing")?.length || 0;
  const topJobs = (jobs || []).slice(0, 3);

  return (
    <div className="space-y-6">
      
      {/* 1. Welcome Banner Card (Supabase Theme with Emerald Glow) */}
      <div className="relative rounded-3xl bg-card border border-border p-6 sm:p-8 shadow-xs overflow-hidden">
        {/* Subtle Emerald Gradient Overlay */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-foreground text-xs font-bold">
              <Sparkles size={12} className="text-primary" />
              <span>Multi-Vector Match Engine Active</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">
              Welcome back,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                {userData?.full_name?.split(" ")[0] || "Candidate"}!
              </span>
            </h1>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              We indexed <strong className="text-foreground">{jobs?.length || 0} active positions</strong> against your resume profile. You have <strong className="text-primary">{shortlistedCount} active opportunities</strong> moving through the pipeline.
            </p>
          </div>

          {/* Profile Completeness SVG Meter */}
          <div className="flex items-center gap-4 bg-muted/60 p-4 rounded-2xl border border-border shrink-0">
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-border"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-primary"
                  strokeDasharray="85, 100"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute text-xs font-black text-foreground">85%</span>
            </div>

            <div>
              <p className="text-xs font-bold text-foreground">Resume Completeness</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">FAISS Vectors Indexed</p>
              <Link
                to="/app/profile"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline mt-1"
              >
                <span>Update Resume</span>
                <ArrowRight size={10} />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Missing Resume Onboarding Banner (M2) */}
      {!userData?.resume_url && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Upload your resume to activate AI matching</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Our Gemini parser and vector embeddings need your resume to compute accurate job match scores.
              </p>
            </div>
          </div>
          <Link
            to="/app/profile"
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all shrink-0 active:scale-[0.98]"
          >
            <span>Upload Resume</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* 2. Three Metric Snapshot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        
        {/* Metric 1: Applications */}
        <Link
          to="/app/applications"
          className="bg-card p-5 rounded-2xl border border-border shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Applications
            </p>
            <p className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
              {applicationsCount}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {shortlistedCount} in active review stages
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
            <FileCheck size={20} />
          </div>
        </Link>

        {/* Metric 2: Matches */}
        <Link
          to="/app/jobs"
          className="bg-card p-5 rounded-2xl border border-border shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Semantic Matches
            </p>
            <p className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
              {jobs?.length || 0}
            </p>
            <p className="text-[11px] text-primary font-semibold">
              Calculated via pgvector cosine
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <TrendingUp size={20} />
          </div>
        </Link>

        {/* Metric 3: AI Assistant */}
        <Link
          to="/app/assistant"
          className="bg-card p-5 rounded-2xl border border-border shadow-2xs hover:shadow-sm hover:border-primary/40 transition-all flex items-center justify-between group"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              AI Career Coach
            </p>
            <p className="text-2xl font-extrabold text-foreground group-hover:text-primary transition-colors">
              Online
            </p>
            <p className="text-[11px] text-muted-foreground">
              Streaming responses ready
            </p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-muted text-foreground group-hover:bg-primary group-hover:text-primary-foreground flex items-center justify-center transition-colors">
            <Bot size={20} />
          </div>
        </Link>

      </div>

      {/* 3. Top AI Recommendations */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="text-primary" size={18} />
            <h2 className="text-lg font-bold text-foreground">
              Top Semantic Recommendations for You
            </h2>
          </div>

          <Link
            to="/app/jobs"
            className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
          >
            <span>View all matching jobs</span>
            <ArrowRight size={12} />
          </Link>
        </div>

        {jobLoading ? (
          <div className="py-12 flex justify-center bg-card rounded-2xl border border-border">
            <Loader />
          </div>
        ) : topJobs.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-2xl border border-border text-muted-foreground text-sm">
            No recommendations generated yet. Upload your resume in the Resume Profile tab!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {topJobs.map((job, idx) => (
              <div key={job.id || idx} className="relative">
                {/* 95% Match Score Floating Badge */}
                <div className="absolute -top-2.5 right-4 z-10 bg-primary text-primary-foreground text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                  <Sparkles size={10} />
                  <span>{95 - idx * 3}% Match</span>
                </div>
                <JobCard job={job} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Bottom Quick AI Coach Prompt Bar */}
      <div className="bg-card rounded-2xl border border-border p-4 sm:p-5 shadow-2xs">
        <div className="flex items-center gap-2 mb-3">
          <Bot size={16} className="text-primary" />
          <span className="text-xs font-bold text-foreground">
            Ask AI Career Coach
          </span>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            — Instant advice grounded in your uploaded resume
          </span>
        </div>

        <form onSubmit={handlePromptSubmit} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="e.g. How do I tailor my resume for senior backend roles?"
            value={quickPrompt}
            onChange={(e) => setQuickPrompt(e.target.value)}
            className="flex-1 bg-input/70 border border-border rounded-xl px-4 py-2.5 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-card transition-all font-medium"
          />
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-4 sm:px-6 py-2.5 rounded-xl shadow-xs transition-all active:scale-[0.98] text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <span>Ask</span>
            <Send size={12} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default Overview;
