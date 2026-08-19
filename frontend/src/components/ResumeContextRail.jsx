import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BrainCircuit,
  Sparkles,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  GraduationCap,
  Briefcase,
  Target
} from "lucide-react";
import api from "../utils/api";
import Loader from "./Loader";

const ResumeContextRail = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResume = async () => {
      setLoading(true);
      try {
        const { data } = await api.get("/ai/resume");
        setProfile(data);
      } catch (err) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    fetchResume();
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-5">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <BrainCircuit size={18} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              AI Resume Context
            </h3>
            <p className="text-[11px] text-slate-400">
              Live context feeding LangChain
            </p>
          </div>
        </div>

        <Link
          to="/app/profile"
          title="Edit Profile & Resume"
          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline"
        >
          <span>Edit</span>
          <ExternalLink size={12} />
        </Link>
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Loader />
        </div>
      ) : !profile ? (
        <div className="bg-amber-50/70 border border-amber-200/70 rounded-xl p-4 text-center">
          <AlertCircle size={20} className="text-amber-500 mx-auto mb-2" />
          <p className="text-xs font-bold text-amber-900 mb-1">
            No Resume Uploaded Yet
          </p>
          <p className="text-[11px] text-amber-700 mb-3">
            Upload your PDF resume to give the AI coach tailored context on your career.
          </p>
          <Link
            to="/app/profile"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg shadow-xs"
          >
            Upload Resume (PDF)
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* Active Extracted Skills */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Sparkles size={13} className="text-indigo-600" />
                Active Skill Embeddings ({profile.skills?.length || 0})
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
              {(profile.skills || []).map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-medium rounded-lg border border-slate-200/80 transition-colors"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Professional Summary Snippet */}
          {profile.summary && (
            <div className="pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 block mb-1.5">
                Extracted Summary
              </span>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                "{profile.summary}"
              </p>
            </div>
          )}

          {/* Education & Experience Details */}
          <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
            {profile.education && (
              <div className="flex items-start gap-2">
                <GraduationCap size={15} className="text-indigo-600 shrink-0 mt-0.5" />
                <span className="font-medium truncate">
                  {typeof profile.education === "string"
                    ? profile.education
                    : Array.isArray(profile.education)
                    ? profile.education[0]?.degree || profile.education[0]?.school || "Degree Listed"
                    : "Degree Provided"}
                </span>
              </div>
            )}
            {profile.experience && (
              <div className="flex items-start gap-2">
                <Briefcase size={15} className="text-violet-600 shrink-0 mt-0.5" />
                <span className="font-medium truncate">
                  {typeof profile.experience === "string"
                    ? profile.experience
                    : Array.isArray(profile.experience)
                    ? `${profile.experience.length} Experience Records`
                    : "Experience Listed"}
                </span>
              </div>
            )}
          </div>

          {/* Live Context Verification Badge */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/70 rounded-xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <p className="text-[11px] font-bold text-emerald-900">
              Injected into LangChain Prompt Context
            </p>
          </div>

        </div>
      )}

    </div>
  );
};

export default ResumeContextRail;
