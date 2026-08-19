import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import moment from "moment";
import {
  Users,
  ChevronLeft,
  Sparkles,
  ExternalLink,
  BrainCircuit,
  CheckCircle2,
  FileText,
  Mail,
  Loader2
} from "lucide-react";
import { toast } from "react-hot-toast";
import MatchGauge from "../components/MatchGauge";
import Loader from "../components/Loader";
import api from "../utils/api";

const ViewApplications = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [recruiterJobs, setRecruiterJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState(jobId || "");
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Fetch recruiter's jobs for the dropdown filter
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data } = await api.get("/recruiter/jobs");
        setRecruiterJobs(data || []);
        if (!selectedJobId && data && data.length > 0) {
          setSelectedJobId(data[0].id);
        }
      } catch (err) {
        // Silent error
      }
    };
    fetchJobs();
  }, []);

  // Fetch applications for selected job
  const fetchApplications = async (jId) => {
    if (!jId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.get(`/recruiter/jobs/${jId}/applications`);
      const sorted = (data || []).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      setApplications(sorted);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch candidate applications");
      setApplications([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedJobId) {
      fetchApplications(selectedJobId);
    }
  }, [selectedJobId]);

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdatingStatusId(applicationId);
    try {
      const { data } = await api.patch(`/recruiter/applications/${applicationId}/status`, {
        status: newStatus,
      });
      if (data.id) {
        toast.success(`Candidate marked as ${newStatus}`);
        setApplications((apps) =>
          apps.map((app) => (app.id === applicationId ? { ...app, status: newStatus } : app))
        );
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update application status");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const getPdfUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    return `${base.replace(/\/api\/?$/, "")}${url}`;
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Job Selector Dropdown */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/dashboard/manage-jobs")}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ChevronLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Users className="text-indigo-600" size={24} />
              <span>ATS Candidate Pipeline</span>
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Review AI-ranked candidates with semantic match scores and resume profiles.
            </p>
          </div>
        </div>

        {/* Job Selector Dropdown */}
        {recruiterJobs.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Job:</span>
            <select
              value={selectedJobId}
              onChange={(e) => {
                setSelectedJobId(e.target.value);
                navigate(`/dashboard/view-applications?job_id=${e.target.value}`);
              }}
              className="bg-white border border-slate-200/80 rounded-xl px-4 py-2 text-xs font-bold text-slate-800 outline-none shadow-xs cursor-pointer max-w-xs"
            >
              {recruiterJobs.map((j) => (
                <option key={j.id} value={j.id}>
                  {j.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 2. Candidate Evaluation Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Candidates Evaluated ({applications.length})
          </h3>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100 flex items-center gap-1.5">
            <Sparkles size={12} /> Ranked by FAISS Semantic Vector Score
          </span>
        </div>

        {isLoading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Users size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900">No applicants for this role yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Candidates who apply will automatically have their resume analyzed and ranked here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Candidate</th>
                  <th className="py-4 px-6">Applied Date</th>
                  <th className="py-4 px-6 text-center">AI Match Fit</th>
                  <th className="py-4 px-6">Resume Document</th>
                  <th className="py-4 px-6 text-right">Stage / Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {applications.map((app) => {
                  const student = app.student || {};
                  const isUpdating = updatingStatusId === app.id;
                  const matchScore = app.match_score || 85;

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Candidate Avatar & Details */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              student.avatar_url ||
                              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                                student.full_name || "Applicant"
                              )}&background=6366f1&color=fff&bold=true`
                            }
                            alt="Candidate"
                            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
                          />
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">
                              {student.full_name || "Candidate"}
                            </p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Mail size={11} className="text-slate-400" />
                              <span>{student.email || "Confidential"}</span>
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Applied Date */}
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {moment(app.applied_at || app.created_at).format("MMM D, YYYY")}
                      </td>

                      {/* AI Match Gauge */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center">
                          <MatchGauge score={matchScore} size={40} />
                        </div>
                      </td>

                      {/* Resume PDF Link */}
                      <td className="py-4 px-6">
                        {app.resume_url || student.resume_url ? (
                          <a
                            href={getPdfUrl(app.resume_url || student.resume_url)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors"
                          >
                            <FileText size={13} />
                            <span>View Resume PDF</span>
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No PDF attached</span>
                        )}
                      </td>

                      {/* Status Selector Dropdown */}
                      <td className="py-4 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {isUpdating && <Loader2 size={14} className="animate-spin text-indigo-600" />}
                          <select
                            value={app.status || "applied"}
                            onChange={(e) => handleStatusUpdate(app.id, e.target.value)}
                            disabled={isUpdating}
                            className={`text-xs font-bold rounded-xl px-3 py-1.5 outline-none border cursor-pointer transition-all ${
                              app.status === "shortlisted"
                                ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                                : app.status === "interviewing"
                                ? "bg-amber-50 text-amber-800 border-amber-200"
                                : app.status === "selected"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : app.status === "rejected"
                                ? "bg-rose-50 text-rose-800 border-rose-200"
                                : "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            <option value="applied">Applied</option>
                            <option value="shortlisted">Shortlisted</option>
                            <option value="interviewing">Interviewing</option>
                            <option value="selected">Selected</option>
                            <option value="rejected">Rejected</option>
                          </select>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ViewApplications;
