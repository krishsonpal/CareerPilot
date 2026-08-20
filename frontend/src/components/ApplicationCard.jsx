import React from "react";
import moment from "moment";
import { Building2, MapPin, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import MatchGauge from "./MatchGauge";

const ApplicationCard = ({ application, onSelect }) => {
  const job = application.job || {};
  const matchScore = application.match_score || 88;
  const appliedDate = application.applied_at || application.created_at;

  const matchedSkills = (job.skills_required || ["Python", "Docker"]).slice(0, 3);
  const missingSkills = (job.skills_required || []).slice(3, 5);

  return (
    <div
      onClick={() => onSelect(application)}
      className="bg-card hover:bg-muted/40 rounded-2xl border border-border hover:border-primary/50 p-4 shadow-2xs hover:shadow-sm transition-all cursor-pointer group space-y-3"
    >
      {/* Top: Company Logo + Title + Match Gauge */}
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xs shrink-0 group-hover:scale-105 transition-transform">
            {job.recruiter?.company_name?.charAt(0) || "C"}
          </div>
          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
              {job.title || "Software Engineer"}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              {job.recruiter?.company_name || "Tech Company"}
            </p>
          </div>
        </div>

        {/* Circular Match Gauge */}
        <MatchGauge score={matchScore} size={36} />
      </div>

      {/* Skills Match vs Gap Pills */}
      <div className="space-y-1.5 pt-1">
        {/* Matched Skills */}
        <div className="flex flex-wrap gap-1 items-center">
          <span className="text-[10px] font-bold text-muted-foreground mr-1">Match:</span>
          {matchedSkills.map((skill, idx) => (
            <span
              key={idx}
              className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20"
            >
              {skill}
            </span>
          ))}
        </div>

        {/* Missing Skills Gap */}
        {missingSkills.length > 0 && (
          <div className="flex flex-wrap gap-1 items-center">
            <span className="text-[10px] font-bold text-muted-foreground mr-1">Gap:</span>
            {missingSkills.map((skill, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-destructive/10 text-destructive px-2 py-0.5 rounded-md border border-destructive/20"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Bottom Applied Date */}
      <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
        <span>Applied {moment(appliedDate).fromNow()}</span>
        <span className="text-primary font-bold group-hover:underline">Details →</span>
      </div>
    </div>
  );
};

export default ApplicationCard;
