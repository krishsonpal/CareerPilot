import React from "react";
import { MapPin, Clock, MoreVertical, Eye, Sparkles, Building2 } from "lucide-react";
import moment from "moment";
import MatchGauge from "./MatchGauge";

const ApplicationCard = ({ application, onSelect }) => {
  const job = application.job || {};
  const matchScore = application.match_score || 88;
  const matchedSkills = application.matched_skills || ["Python", "FastAPI", "Docker", "SQL"];
  const missingSkills = application.missing_skills || ["Kubernetes"];

  return (
    <div
      onClick={() => onSelect && onSelect(application)}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-300 p-4 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between space-y-3 hover:-translate-y-0.5"
    >
      <div>
        {/* Top Header: Logo, Title, Match Gauge */}
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              {job.recruiter?.company_name?.charAt(0) || "C"}
            </div>
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors truncate">
                {job.title || "Software Engineer"}
              </h4>
              <p className="text-xs text-slate-500 font-semibold truncate">
                {job.recruiter?.company_name || "Premier Tech Corp"}
              </p>
            </div>
          </div>

          {/* AI Match Fit Gauge (from Screen 6) */}
          <MatchGauge score={matchScore} size={42} />
        </div>

        {/* Location & Applied Timestamp */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 font-medium mb-3">
          <div className="flex items-center gap-1">
            <MapPin size={12} className="text-slate-400" />
            <span>{job.is_remote ? "Remote" : (job.location || "San Francisco, CA")}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={12} className="text-slate-400" />
            <span>{moment(application.applied_at || application.created_at).fromNow()}</span>
          </div>
        </div>

        {/* Matched Skills Pills */}
        <div className="space-y-1.5 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Matched Skills:
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {matchedSkills.slice(0, 3).map((skill, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200/80 text-[10px] font-semibold rounded-md"
              >
                {skill}
              </span>
            ))}
            {matchedSkills.length > 3 && (
              <span className="px-1.5 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-semibold rounded-md border border-slate-200">
                +{matchedSkills.length - 3}
              </span>
            )}
          </div>
        </div>

        {/* Missing Skills Gap Pills */}
        {missingSkills.length > 0 && (
          <div className="space-y-1 pt-1.5">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Missing Skills:
              </span>
            </div>
            <div className="flex flex-wrap gap-1">
              {missingSkills.slice(0, 2).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-rose-50 text-rose-600 border border-rose-200/80 text-[10px] font-semibold rounded-md"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer Note */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span className="capitalize font-semibold text-slate-600">
          Status: {application.status || "Applied"}
        </span>
        <span className="text-indigo-600 font-bold group-hover:underline flex items-center gap-0.5">
          <Eye size={12} /> Details
        </span>
      </div>
    </div>
  );
};

export default ApplicationCard;
