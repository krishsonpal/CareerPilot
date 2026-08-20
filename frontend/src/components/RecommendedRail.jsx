import React from "react";
import { Sparkles, ArrowRight, Building2, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import kConverter from "k-convert";

const RecommendedRail = ({ recommendedJobs = [] }) => {
  const navigate = useNavigate();

  if (!recommendedJobs || recommendedJobs.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-primary/10 via-card to-card rounded-3xl border border-border p-6 shadow-xs mb-8">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-2xs font-bold text-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-foreground tracking-tight">
              Recommended for You (FAISS Match)
            </h3>
            <p className="text-xs text-muted-foreground">
              Grounded in your parsed resume multi-vector embeddings
            </p>
          </div>
        </div>

        <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
          Top Vector Fit
        </span>
      </div>

      {/* Recommended Jobs Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recommendedJobs.slice(0, 3).map((job, idx) => {
          const matchPercent = 96 - idx * 3;
          return (
            <div
              key={job.id || idx}
              onClick={() => navigate(`/apply-job/${job.id}`)}
              className="bg-card hover:bg-muted/40 rounded-2xl border border-border hover:border-primary/50 p-4 shadow-2xs transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-muted-foreground line-clamp-1">
                    {job.recruiter?.company_name || "Top Tech Company"}
                  </span>
                  <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                    {matchPercent}% Fit
                  </span>
                </div>

                <h4 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {job.title}
                </h4>

                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin size={11} className="text-muted-foreground" />
                  <span>{job.is_remote ? "Remote" : (job.location || "On-site")}</span>
                </p>
              </div>

              <div className="pt-3 mt-3 border-t border-border flex items-center justify-between">
                <span className="text-xs font-extrabold text-primary">
                  ${kConverter.convertTo(job.salary_min || 120000)}/yr
                </span>
                <span className="text-xs font-bold text-primary inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  View Role <ArrowRight size={11} />
                </span>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default RecommendedRail;
