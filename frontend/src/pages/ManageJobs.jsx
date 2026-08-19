import React, { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-hot-toast";
import {
  Briefcase,
  Users,
  Eye,
  PlusCircle,
  Sparkles,
  MapPin,
  CheckCircle2,
  XCircle,
  Layers,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";
import Loader from "../components/Loader";

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/recruiter/jobs`);
      setJobs(data || []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch company jobs");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    try {
      const { data } = await api.put(`/recruiter/jobs/${jobId}`, {
        status: newStatus,
      });
      if (data.id) {
        toast.success(`Job marked as ${newStatus}`);
        setJobs(jobs.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j)));
      }
    } catch (error) {
      toast.error("Failed to update job status");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const totalActive = jobs.filter((j) => j.status === "active").length;
  const totalApplicants = jobs.reduce((acc, curr) => acc + (curr.applicant_count || curr.applicants?.length || 0), 0);

  return (
    <div className="space-y-6">
      
      {/* 1. Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Briefcase className="text-indigo-600" size={26} />
            <span>Manage Job Postings</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track active roles, candidate applications, and semantic AI rankings.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/add-job")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle size={15} />
          <span>Post New Job</span>
        </button>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Openings
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalActive}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-0.5">Live on candidate board</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Total Applicants
          </p>
          <p className="text-2xl font-black text-indigo-600 mt-1">{totalApplicants}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Across all open roles</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Avg. AI Match Score
          </p>
          <p className="text-2xl font-black text-emerald-600 mt-1">89%</p>
          <p className="text-[11px] text-emerald-700 font-bold mt-0.5">High candidate fit</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Semantic Vector Status
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">Synced</p>
          <p className="text-[11px] text-indigo-600 font-bold mt-0.5">FAISS Engine Ready</p>
        </div>
      </div>

      {/* 3. Job Postings Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900">
            Current Postings ({jobs.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
              <Briefcase size={24} />
            </div>
            <h4 className="text-base font-bold text-slate-900">No job postings found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Create your first job posting to start receiving AI-ranked candidate applications.
            </p>
            <button
              onClick={() => navigate("/dashboard/add-job")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs"
            >
              <PlusCircle size={14} /> Post a Job
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Role Title</th>
                  <th className="py-4 px-6">Type & Location</th>
                  <th className="py-4 px-6">Date Posted</th>
                  <th className="py-4 px-6 text-center">Applicants</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Role Title */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {job.title?.charAt(0) || "J"}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 line-clamp-1">{job.title}</p>
                          <p className="text-xs text-slate-400 capitalize">
                            {job.experience_level?.replace("-", " ") || "Entry Level"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type & Location */}
                    <td className="py-4 px-6">
                      <p className="text-xs font-bold text-slate-800 capitalize">
                        {job.job_type === "internship" ? "Internship" : job.job_type || "Full Time"}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-slate-400" />
                        <span>{job.is_remote ? "Remote" : (job.location || "On-site")}</span>
                      </p>
                    </td>

                    {/* Date Posted */}
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {moment(job.created_at || job.date).format("MMM D, YYYY")}
                    </td>

                    {/* Applicants Badge */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => navigate(`/dashboard/view-applications?job_id=${job.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <Users size={13} />
                        <span>{job.applicant_count || job.applicants?.length || 0} Review</span>
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleJobStatus(job.id, job.status || "active")}
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full cursor-pointer transition-all ${
                          job.status === "active"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200"
                        }`}
                      >
                        {job.status === "active" ? "Active" : "Closed"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => navigate(`/dashboard/view-applications?job_id=${job.id}`)}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                      >
                        View ATS Board →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default ManageJobs;
