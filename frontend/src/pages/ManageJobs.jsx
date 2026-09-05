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
  ArrowRight,
  Edit3,
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Briefcase className="text-primary" size={26} />
            <span>Manage Job Postings</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track active roles, candidate applications, and semantic AI rankings.
          </p>
        </div>

        <button
          onClick={() => navigate("/dashboard/add-job")}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98] cursor-pointer"
        >
          <PlusCircle size={15} />
          <span>Post New Job</span>
        </button>
      </div>

      {/* 2. Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Active Openings
          </p>
          <p className="text-2xl font-black text-foreground mt-1">{totalActive}</p>
          <p className="text-[11px] text-primary font-bold mt-0.5">Live on candidate board</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Applicants
          </p>
          <p className="text-2xl font-black text-primary mt-1">{totalApplicants}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Across all open roles</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Avg. AI Match Score
          </p>
          <p className="text-2xl font-black text-primary mt-1">89%</p>
          <p className="text-[11px] text-primary font-bold mt-0.5">High candidate fit</p>
        </div>

        <div className="bg-card p-5 rounded-2xl border border-border shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Semantic Vector Status
          </p>
          <p className="text-2xl font-black text-foreground mt-1">Synced</p>
          <p className="text-[11px] text-primary font-bold mt-0.5">FAISS Engine Ready</p>
        </div>
      </div>

      {/* 3. Job Postings Table */}
      <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-bold text-foreground">
            Current Postings ({jobs.length})
          </h3>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader />
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <Briefcase size={24} />
            </div>
            <h4 className="text-base font-bold text-foreground">No job postings found</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              Create your first job posting to start receiving AI-ranked candidate applications.
            </p>
            <button
              onClick={() => navigate("/dashboard/add-job")}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground font-bold text-xs rounded-xl shadow-xs"
            >
              <PlusCircle size={14} /> Post a Job
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6">Role Title</th>
                  <th className="py-4 px-6">Type & Location</th>
                  <th className="py-4 px-6">Date Posted</th>
                  <th className="py-4 px-6 text-center">Applicants</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-medium">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-muted/30 transition-colors">
                    {/* Role Title */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xs shrink-0">
                          {job.title?.charAt(0) || "J"}
                        </div>
                        <div>
                          <p className="font-bold text-foreground line-clamp-1">{job.title}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            {job.experience_level?.replace("-", " ") || "Entry Level"}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Type & Location */}
                    <td className="py-4 px-6">
                      <p className="text-xs font-bold text-foreground capitalize">
                        {job.job_type === "internship" ? "Internship" : job.job_type || "Full Time"}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={11} className="text-muted-foreground" />
                        <span>{job.is_remote ? "Remote" : (job.location || "On-site")}</span>
                      </p>
                    </td>

                    {/* Date Posted */}
                    <td className="py-4 px-6 text-xs text-muted-foreground">
                      {moment(job.created_at || job.date).format("MMM D, YYYY")}
                    </td>

                    {/* Applicants Badge */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => navigate(`/dashboard/view-applications?job_id=${job.id}`)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-bold text-xs rounded-xl border border-primary/20 transition-colors cursor-pointer"
                      >
                        <Users size={13} />
                        <span>{job.applicant_count || job.applicants?.length || 0} Review</span>
                      </button>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => toggleJobStatus(job.id, job.status || "active")}
                        className={`inline-flex px-3 py-1 text-xs font-bold rounded-full cursor-pointer transition-all border ${
                          job.status === "active"
                            ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                            : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                        }`}
                      >
                        {job.status === "active" ? "Active" : "Closed"}
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => navigate(`/dashboard/edit-job/${job.id}`)}
                          title="Edit Job Posting"
                          className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                        >
                          <Edit3 size={13} />
                          <span className="hidden sm:inline">Edit</span>
                        </button>
                        <button
                          onClick={() => navigate(`/dashboard/view-applications?job_id=${job.id}`)}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          ATS Board →
                        </button>
                      </div>
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
