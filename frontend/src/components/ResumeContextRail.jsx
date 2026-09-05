import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FileText,
  Sparkles,
  ExternalLink,
  Layers,
  GraduationCap,
  Briefcase,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import api from "../utils/api";

const ResumeContextRail = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get("/ai/resume");
        setProfile(data);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-5">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <FileText size={16} />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
              Active Resume Context
            </h3>
            <p className="text-[11px] text-muted-foreground">Feeding LangChain & FAISS</p>
          </div>
        </div>

        <Link
          to="/app/profile"
          className="text-muted-foreground hover:text-primary transition-colors p-1"
          title="Edit Profile"
        >
          <ExternalLink size={14} />
        </Link>
      </div>

      {loading ? (
        <div className="py-8 text-center">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-xs text-muted-foreground">Reading vector context...</p>
        </div>
      ) : !profile ? (
        <div className="py-6 text-center space-y-2">
          <AlertCircle size={24} className="text-muted-foreground mx-auto" />
          <p className="text-xs font-bold text-foreground">No Resume Profile Active</p>
          <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
            Upload your resume PDF to provide your AI coach with verified project & skill context.
          </p>
          <Link
            to="/app/profile"
            className="inline-block mt-2 px-3 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl shadow-xs"
          >
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="space-y-4 text-xs">
          
          {/* Executive Summary */}
          <div>
            <h4 className="font-extrabold uppercase text-muted-foreground text-[10px] tracking-wider mb-1 flex items-center gap-1">
              <Sparkles size={11} className="text-primary" />
              <span>Extracted Summary</span>
            </h4>
            <p className="text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border leading-relaxed line-clamp-4">
              {profile.summary || "Summary extracted from uploaded resume."}
            </p>
          </div>

          {/* Core Skills Chips */}
          <div>
            <h4 className="font-extrabold uppercase text-muted-foreground text-[10px] tracking-wider mb-1.5 flex items-center gap-1">
              <Layers size={11} className="text-primary" />
              <span>Key Skills Vectors ({(profile.skills || []).length})</span>
            </h4>
            <div className="flex flex-wrap gap-1">
              {(profile.skills || []).slice(0, 10).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-muted text-foreground text-[11px] font-semibold rounded-md border border-border"
                >
                  {skill}
                </span>
              ))}
              {(profile.skills?.length || 0) > 10 && (
                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-[11px] font-semibold rounded-md">
                  +{profile.skills.length - 10} more
                </span>
              )}
            </div>
          </div>

          {/* Education Details */}
          {profile.education && (
            <div>
              <h4 className="font-extrabold uppercase text-muted-foreground text-[10px] tracking-wider mb-1 flex items-center gap-1">
                <GraduationCap size={11} className="text-primary" />
                <span>Education</span>
              </h4>
              <p className="text-foreground font-semibold bg-muted/40 p-2.5 rounded-xl border border-border">
                {typeof profile.education === "string"
                  ? profile.education
                  : Array.isArray(profile.education)
                  ? profile.education[0]?.degree || profile.education[0]?.school || "Degree details"
                  : "Higher Education"}
              </p>
            </div>
          )}

          {/* Status Indicator & Navigation */}
          <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1 text-primary font-bold">
              <CheckCircle2 size={12} /> FAISS Synced
            </span>
            <div className="flex items-center gap-3">
              <Link to="/app/jobs" className="text-primary hover:underline font-bold">
                Find Jobs →
              </Link>
              <Link to="/app/profile" className="text-muted-foreground hover:text-foreground font-semibold">
                Edit
              </Link>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};

export default ResumeContextRail;
