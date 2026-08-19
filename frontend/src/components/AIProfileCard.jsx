import React, { useState } from "react";
import {
  BrainCircuit,
  Sparkles,
  GraduationCap,
  Briefcase,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  X
} from "lucide-react";

const AIProfileCard = ({ profile, loading }) => {
  const [newSkill, setNewSkill] = useState("");
  const [skillsList, setSkillsList] = useState(profile?.skills || []);

  // Update local skills when profile changes
  React.useEffect(() => {
    setSkillsList(profile?.skills || []);
  }, [profile]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center">
        <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Loading AI Profile Context...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/80 p-8 shadow-xs text-center space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <BrainCircuit size={24} />
        </div>
        <h4 className="text-sm font-bold text-slate-800">No Parsed Profile Yet</h4>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          Upload your PDF resume on the left to extract your skills, experience, and structured AI embeddings.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-6">
      
      {/* Top Header & Status Verification Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-xs">
            <BrainCircuit size={20} />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Parsed AI Candidate Profile
            </h3>
            <p className="text-xs text-slate-500">
              Extracted via Gemini 3.1 & Multi-Vector Embedding
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold self-start sm:self-auto">
          <CheckCircle2 size={13} className="text-emerald-600" />
          <span>FAISS Multi-Vector Indexed</span>
        </div>
      </div>

      {/* 1. Executive Professional Summary */}
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-600" />
          <span>Executive Summary</span>
        </h4>
        <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/60">
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
            {profile.summary || "Summary successfully extracted from your resume."}
          </p>
        </div>
      </div>

      {/* 2. Core Skills & Tech Stack */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Layers size={13} className="text-indigo-600" />
            <span>Extracted Skills & Tech Stack ({skillsList.length})</span>
          </h4>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {skillsList.map((skill, idx) => (
            <span
              key={idx}
              className="px-3 py-1 bg-indigo-50/80 text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200/70 flex items-center gap-1.5"
            >
              <span>{skill}</span>
            </span>
          ))}
        </div>
      </div>

      {/* 3. Work Experience Records */}
      {profile.experience && (
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <Briefcase size={13} className="text-violet-600" />
            <span>Experience & Projects</span>
          </h4>

          {typeof profile.experience === "string" ? (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed">
              {profile.experience}
            </div>
          ) : Array.isArray(profile.experience) ? (
            <div className="space-y-3">
              {profile.experience.map((exp, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-slate-900">
                      {exp.role || exp.title || "Software Engineering Role"}
                    </p>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {exp.duration || exp.period || "Recent"}
                    </span>
                  </div>
                  <p className="text-xs text-indigo-600 font-semibold">
                    {exp.company || exp.organization || "Company"}
                  </p>
                  {exp.description && (
                    <p className="text-xs text-slate-600 leading-relaxed pt-1">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      )}

      {/* 4. Education History */}
      {profile.education && (
        <div className="pt-2 border-t border-slate-100">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
            <GraduationCap size={13} className="text-indigo-600" />
            <span>Education</span>
          </h4>

          <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/60">
            <p className="text-xs font-bold text-slate-900">
              {typeof profile.education === "string"
                ? profile.education
                : Array.isArray(profile.education)
                ? profile.education[0]?.degree || profile.education[0]?.school || "Degree Details"
                : "Higher Education Degree"}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};

export default AIProfileCard;
