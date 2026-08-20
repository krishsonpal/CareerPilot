import React from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, MapPin, Building2, DollarSign, Clock, ArrowRight } from "lucide-react";
import kConverter from "k-convert";
import moment from "moment";
import { assets } from "../assets/assets";

const JobCard = ({ job }) => {
  const navigate = useNavigate();
  const id = job.id || job._id;

  const formatSalary = () => {
    if (job.salary_min && job.salary_max) {
      return `$${kConverter.convertTo(job.salary_min)} - $${kConverter.convertTo(job.salary_max)}`;
    }
    if (job.salary_min) return `$${kConverter.convertTo(job.salary_min)}`;
    if (job.stipend) return job.stipend;
    return "$120k+";
  };

  const handleAskAI = (e) => {
    e.stopPropagation();
    const prompt = `Tell me about the requirements for the "${job.title}" position at "${job.recruiter?.company_name || 'this company'}" and analyze how my resume matches it.`;
    navigate("/app/assistant", { state: { initialPrompt: prompt } });
  };

  const handleApply = (e) => {
    e.stopPropagation();
    if (id) {
      navigate(`/apply-job/${id}`);
      window.scrollTo(0, 0);
    }
  };

  return (
    <div
      onClick={handleApply}
      className="bg-card text-card-foreground rounded-2xl border border-border hover:border-primary/50 p-5 shadow-2xs hover:shadow-sm transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-0.5"
    >
      <div>
        {/* Top Row: Logo, Title & Salary Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-sm shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              {job.recruiter?.company_name?.charAt(0) || "C"}
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                <span className="font-bold text-foreground">{job.recruiter?.company_name || "Confidential Company"}</span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} className="text-muted-foreground" />
                  {job.is_remote ? "Remote" : (job.location || "On-site")}
                </span>
              </p>
            </div>
          </div>

          {/* Salary Badge */}
          <span className="inline-flex items-center text-xs font-extrabold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-xl whitespace-nowrap shrink-0 shadow-2xs">
            {formatSalary()}
          </span>
        </div>

        {/* Middle: Tech Stack Skills Badges */}
        <div className="flex flex-wrap gap-1.5 my-3.5">
          {(job.skills_required || ["Python", "FastAPI", "Docker"]).slice(0, 5).map((skill, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 bg-muted text-foreground text-xs font-semibold rounded-lg border border-border"
            >
              {skill}
            </span>
          ))}
          {(job.skills_required?.length || 0) > 5 && (
            <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs font-semibold rounded-lg border border-border">
              +{job.skills_required.length - 5}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Actions Row */}
      <div className="pt-3 mt-1 border-t border-border flex items-center justify-between gap-3">
        {/* Ask AI Button */}
        <button
          type="button"
          onClick={handleAskAI}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          <Sparkles size={13} className="text-primary" />
          <span>Ask AI about Job</span>
        </button>

        {/* Apply Button */}
        <button
          type="button"
          onClick={handleApply}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Apply Now</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};

export default JobCard;
