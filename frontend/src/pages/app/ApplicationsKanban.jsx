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
  Clock
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

  // Filter applications by role type if selected
  const filteredApplications = useMemo(() => {
    const list = userApplication || [];
    if (selectedRoleType === "all") return list;
    return list.filter((app) => app.job?.job_type === selectedRoleType);
  }, [userApplication, selectedRoleType]);

  // Group applications into 4 Kanban stages
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
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileCheck className="text-indigo-600" size={26} />
            <span>My Applications</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Track your pipeline status, AI match scores, and interview progress.
          </p>
        </div>

        {/* View Mode Switcher & Filter */}
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Role Type Filter */}
          <select
            value={selectedRoleType}
            onChange={(e) => setSelectedRoleType(e.target.value)}
            className="bg-white border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none shadow-xs cursor-pointer"
          >
            <option value="all">All Role Types</option>
            <option value="internship">Internships</option>
            <option value="full-time">Full Time</option>
            <option value="contract">Contract</option>
          </select>

          {/* View Toggle (Kanban vs Table) */}
          <div className="flex items-center p-1 bg-slate-100/80 rounded-xl border border-slate-200/60 shadow-xs">
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "kanban"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Kanban Board</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-white text-indigo-600 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
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
        <div className="py-20 flex justify-center bg-white rounded-2xl border border-slate-200/80">
          <Loader />
        </div>
      ) : !userApplication || userApplication.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center max-w-md mx-auto space-y-4">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileCheck size={28} />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No applications yet</h3>
          <p className="text-sm text-slate-500">
            Browse semantic job recommendations and apply with 1-click using your parsed AI profile.
          </p>
          <Link
            to="/app/jobs"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs"
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
            colorClass="bg-slate-200 text-slate-700"
            items={columns.applied}
            onSelectCard={(app) => setSelectedApp(app)}
          />

          <KanbanColumn
            title="Shortlisted"
            count={columns.shortlisted.length}
            colorClass="bg-indigo-100 text-indigo-700"
            items={columns.shortlisted}
            onSelectCard={(app) => setSelectedApp(app)}
          />

          <KanbanColumn
            title="Interviewing"
            count={columns.interviewing.length}
            colorClass="bg-amber-100 text-amber-800"
            items={columns.interviewing}
            onSelectCard={(app) => setSelectedApp(app)}
          />

          <KanbanColumn
            title="Selected"
            count={columns.selected.length}
            colorClass="bg-emerald-100 text-emerald-800"
            items={columns.selected}
            onSelectCard={(app) => setSelectedApp(app)}
          />
        </div>

      ) : (

        /* ── Table View ─────────────────────────────────────────────── */
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Company & Role</th>
                  <th className="py-4 px-6">Location</th>
                  <th className="py-4 px-6">Date Applied</th>
                  <th className="py-4 px-6 text-center">AI Match Fit</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {filteredApplications.map((app) => {
                  const job = app.job || {};
                  return (
                    <tr
                      key={app.id}
                      onClick={() => setSelectedApp(app)}
                      className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                    >
                      {/* Company & Role */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {job.recruiter?.company_name?.charAt(0) || "C"}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">
                              {job.title || "Job Position"}
                            </p>
                            <p className="text-xs text-slate-500">
                              {job.recruiter?.company_name || "Company"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Location */}
                      <td className="py-4 px-6 text-xs text-slate-600">
                        {job.is_remote ? "Remote" : (job.location || "On-site")}
                      </td>

                      {/* Date Applied */}
                      <td className="py-4 px-6 text-xs text-slate-500">
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
                          className={`inline-flex px-3 py-1 text-xs font-bold rounded-full capitalize ${
                            app.status === "shortlisted"
                              ? "bg-indigo-100 text-indigo-700"
                              : app.status === "interviewing"
                              ? "bg-amber-100 text-amber-800"
                              : app.status === "selected"
                              ? "bg-emerald-100 text-emerald-800"
                              : app.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-slate-100 text-slate-700"
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
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-base shrink-0 shadow-xs">
                  {selectedApp.job?.recruiter?.company_name?.charAt(0) || "C"}
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    {selectedApp.job?.title || "Position Details"}
                  </h3>
                  <p className="text-xs text-slate-500 font-bold">
                    {selectedApp.job?.recruiter?.company_name || "Company"} • Applied {moment(selectedApp.applied_at || selectedApp.created_at).fromNow()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedApp(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              
              {/* Match Fit Score Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                    FAISS Vector Match Score
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculated against your parsed resume profile
                  </p>
                </div>
                <MatchGauge score={selectedApp.match_score || 88} size={48} />
              </div>

              {/* Status Badge */}
              <div>
                <span className="text-xs font-bold text-slate-500 block mb-1">Current Stage</span>
                <span className="inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {selectedApp.status || "applied"}
                </span>
              </div>

              {/* Cover Letter */}
              {selectedApp.cover_letter && (
                <div>
                  <span className="text-xs font-bold text-slate-500 block mb-1">Cover Letter</span>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed whitespace-pre-wrap">
                    {selectedApp.cover_letter}
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <button
                onClick={() => {
                  if (selectedApp.job?.id) {
                    navigate(`/apply-job/${selectedApp.job.id}`);
                  }
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800"
              >
                <span>View Full Job Spec</span>
                <ExternalLink size={12} />
              </button>

              <button
                onClick={() => setSelectedApp(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default ApplicationsKanban;
