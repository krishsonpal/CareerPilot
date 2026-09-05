import React, { useContext, useEffect, useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FileCheck,
  LayoutGrid,
  List,
  Sparkles,
  Search,
  Filter,
  X,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  DollarSign,
  Clock,
} from "lucide-react";
import moment from "moment";
import { AppContext } from "../../context/AppContext";
import KanbanColumn from "../../components/KanbanColumn";
import MatchGauge from "../../components/MatchGauge";
import Loader from "../../components/Loader";
import api from "../../utils/api";

const ApplicationsKanban = () => {
  const { userApplication, applicationsLoading, fetchUserApplication } = useContext(AppContext);
  const [viewMode, setViewMode] = useState("kanban"); // "kanban" | "table"
  const [selectedRoleType, setSelectedRoleType] = useState("all");
  const [selectedApp, setSelectedApp] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserApplication();
  }, []);

  const filteredApplications = useMemo(() => {
    const list = userApplication || [];
    if (selectedRoleType === "all") return list;
    return list.filter((app) => app.job?.job_type === selectedRoleType);
  }, [userApplication, selectedRoleType]);

  const columns = useMemo(() => {
    return {
      applied: filteredApplications.filter((a) => (a.status || "applied") === "applied"),
      shortlisted: filteredApplications.filter((a) => a.status === "shortlisted"),
      interviewing: filteredApplications.filter((a) => a.status === "interviewing"),
      selected: filteredApplications.filter((a) => a.status === "selected"),
      rejected: filteredApplications.filter((a) => a.status === "rejected"),
    };
  }, [filteredApplications]);

  return (
    <div className="space-y-6">
      
      {/* 1. Top Bar: Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <FileCheck className="text-primary" size={26} />
            <span>My Applications</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your pipeline status, AI match scores, and interview progress.
          </p>
        </div>

        {/* View Mode Switcher & Filter & Find Jobs CTA (M5) */}
        <div className="flex flex-wrap items-center gap-3">
          
          <Link
            to="/app/jobs"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors shadow-xs"
          >
            <Sparkles size={13} />
            <span>Find More Jobs</span>
          </Link>

          {/* Role Type Filter */}
          <select
            value={selectedRoleType}
            onChange={(e) => setSelectedRoleType(e.target.value)}
            className="bg-card border border-border rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none shadow-xs cursor-pointer"
          >
            <option value="all">All Role Types</option>
            <option value="internship">Internships</option>
            <option value="full-time">Full Time</option>
            <option value="contract">Contract</option>
          </select>

          {/* View Toggle (Kanban vs Table) */}
          <div className="flex items-center p-1 bg-muted rounded-xl border border-border shadow-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-card text-foreground shadow-2xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List size={14} />
              <span>Table View</span>
            </button>
          </div>

        </div>
      </div>

      {/* 2. Main Content View */}
      {applicationsLoading ? (
        <div className="py-20 flex justify-center bg-card rounded-2xl border border-border">
          <Loader />
        </div>
      ) : !userApplication || userApplication.length === 0 ? (
        <div className="bg-card rounded-2xl border border-border p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck size={28} />
          </div>
          <h3 className="text-lg font-bold text-foreground">No applications yet</h3>
          <p className="text-sm text-muted-foreground">
            Browse semantic job recommendations and apply with 1-click using your parsed AI profile.
          </p>
          <Link
            to="/app/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs"
          >
            Explore Matching Jobs
          </Link>
        </div>
      ) : viewMode === "kanban" ? (
        
        /* ── Kanban Board View ────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 items-start">
          <KanbanColumn
            title="Applied"
            count={columns.applied.length}
            colorClass="bg-muted text-foreground"
            items={columns.applied}
            onSelectCard={(app) => setSelectedApp(app)}
          />

          <KanbanColumn
            title="Shortlisted"
            count={columns.shortlisted.length}
            colorClass="bg-primary/10 text-primary"
            items={columns.shortlisted}
            onSelectCard={(app) => setSelectedApp(app)}
          />

          <KanbanColumn
            title="Interviewing"
            count={columns.interviewing.length}
            colorClass="bg-amber-500/10 text-amber-500"
            items={columns.interviewing}
            onSelectCard={(app) => setSelectedApp(app)}
          />

          <KanbanColumn
            title="Selected"
            count={columns.selected.length}
            colorClass="bg-emerald-500/10 text-emerald-500"
            items={columns.selected}
            onSelectCard={(app) => setSelectedApp(app)}
          />
        </div>

      ) : (

        /* ── Table View ─────────────────────────────────────────────── */
        <div className="bg-card rounded-2xl border border-border shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  <th className="py-4 px-6">Company & Role</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Date Applied</th>
                  <th className="py-4 px-6 text-center">AI Match Fit</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm font-medium">
                {filteredApplications.map((app) => {
                  const job = app.job || {};
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      {/* Company & Role */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-black text-xs shrink-0">
                            {job.recruiter?.company_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-bold text-foreground line-clamp-1">
                              {job.title || "Job Position"}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {job.recruiter?.company_name || "Company"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        {job.is_remote ? "Remote" : (job.location || "On-site")}
                      </td>

                      {/* Date Applied */}
                      <td className="py-4 px-6 text-xs text-muted-foreground">
                        {moment(app.applied_at || app.created_at).format("MMM D, YYYY")}
                      </td>

                      {/* AI Match Gauge */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex justify-center">
                          <MatchGauge score={app.match_score || 88} size={38} />
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-6 text-center">
                        <span
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full capitalize border border-border ${
                            app.status === "shortlisted"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : app.status === "interviewing"
                              ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                              : app.status === "selected"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : app.status === "rejected"
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          {app.status || "applied"}
                        </span>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedApp(app);
                          }}
                          className="text-xs font-bold text-primary hover:underline cursor-pointer"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* 3. Application Details Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
          <div className="bg-card rounded-3xl border border-border shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-border flex items-start justify-between bg-muted/30">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-foreground text-background flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                  {selectedApp.job?.recruiter?.company_name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-foreground">
                    {selectedApp.job?.title || "Position Details"}
                  </h3>
                  <p className="text-xs text-muted-foreground font-bold">
                    {selectedApp.job?.recruiter?.company_name || "Company"} • Applied {moment(selectedApp.applied_at || selectedApp.created_at).fromNow()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Match Fit Score Breakdown */}
              <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
                    FAISS Vector Match Score
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Calculated against your parsed resume profile
                  </p>
                </div>
                <MatchGauge score={selectedApp.match_score || 88} size={48} />
              </div>

              {/* Status Badge */}
              <div>
                <span className="text-xs font-bold text-muted-foreground block mb-1">Current Stage</span>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                  {selectedApp.status || "applied"}
                </span>
              </div>

              {/* Cover Letter */}
              {selectedApp.cover_letter && (
                <div>
                  <span className="text-xs font-bold text-muted-foreground block mb-1">Cover Letter</span>
                  <p className="text-xs text-foreground bg-muted/40 p-3 rounded-xl border border-border leading-relaxed whitespace-pre-wrap">
                    {selectedApp.cover_letter}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-border bg-muted/30 flex flex-wrap items-center justify-between gap-2">
              <button
                onClick={() => {
                  if (selectedApp.job?.id) {
                    navigate(`/apply-job/${selectedApp.job.id}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <span>View Full Job Spec</span>
                <ExternalLink size={12} />
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    navigate("/app/assistant", {
                      state: {
                        initialPrompt: `Give me interview preparation advice for my application to the "${selectedApp.job?.title}" role at "${selectedApp.job?.recruiter?.company_name || 'this company'}".`
                      }
                    });
                  }}
                  className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 font-bold text-xs rounded-xl inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Sparkles size={13} />
                  <span>Interview Prep AI</span>
                </button>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold text-xs rounded-xl cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationsKanban;
