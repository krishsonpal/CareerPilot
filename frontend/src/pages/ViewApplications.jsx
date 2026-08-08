import moment from "moment";
import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { LoaderCircle, ChevronLeft, CheckCircle, XCircle, BrainCircuit } from "lucide-react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../utils/api";

const ViewApplications = () => {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const navigate = useNavigate();

  const [applications, setApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  const fetchApplications = async () => {
    if (!jobId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await api.get(`/recruiter/jobs/${jobId}/applications`);
      // Sort by match_score descending
      const sorted = (data || []).sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
      setApplications(sorted);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch applications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId, newStatus) => {
    setUpdatingStatus(applicationId);
    try {
      const { data } = await api.patch(`/recruiter/applications/${applicationId}/status`, {
        status: newStatus
      });
      if (data.id) {
        toast.success(`Application marked as ${newStatus}`);
        setApplications(apps => apps.map(app => app.id === applicationId ? { ...app, status: newStatus } : app));
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-xl font-semibold text-gray-700">No Job Selected</h2>
        <p className="text-gray-500 mt-2">Please select a job from the Manage Jobs page to view applicants.</p>
        <button onClick={() => navigate('/dashboard/manage-jobs')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Go back
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <LoaderCircle className="animate-spin h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-6xl mx-auto"
    >
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => navigate('/dashboard/manage-jobs')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Applicants</h2>
          <p className="text-gray-500 mt-1">Review and manage candidates powered by AI matching.</p>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <BrainCircuit className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No applicants yet</h3>
          <p className="text-gray-500 mt-1">Candidates matching this job profile will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map((app) => (
            <div key={app.id} className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-300 transition-colors shadow-sm relative overflow-hidden">
              {/* Score Badge Background Element */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-10"></div>
              
              <div className="flex flex-col md:flex-row justify-between gap-6">
                
                {/* Candidate Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Candidate #{app.user_id.substring(0, 8)}</h3>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      Applied {moment(app.applied_at).fromNow()}
                    </span>
                  </div>
                  
                  {/* AI Analysis section */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 flex items-center gap-1.5 mb-2">
                      <BrainCircuit className="h-4 w-4 text-indigo-500" /> 
                      AI Match Analysis
                    </h4>
                    
                    <div className="flex flex-wrap gap-4">
                      {/* Matched Skills */}
                      <div className="flex-1 min-w-[200px] bg-green-50/50 rounded-lg p-3 border border-green-100">
                        <p className="text-xs font-semibold text-green-700 uppercase tracking-wider mb-2">Matched Skills</p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.matched_skills && app.matched_skills.length > 0 ? app.matched_skills.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">{s}</span>
                          )) : <span className="text-xs text-green-600/50">None matching</span>}
                        </div>
                      </div>
                      
                      {/* Missing Skills */}
                      <div className="flex-1 min-w-[200px] bg-amber-50/50 rounded-lg p-3 border border-amber-100">
                        <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Skill Gaps</p>
                        <div className="flex flex-wrap gap-1.5">
                          {app.missing_skills && app.missing_skills.length > 0 ? app.missing_skills.map(s => (
                            <span key={s} className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">{s}</span>
                          )) : <span className="text-xs text-amber-600/50">No major gaps</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {app.cover_letter && (
                    <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <span className="font-semibold text-gray-700 block mb-1">Cover Note:</span>
                      {app.cover_letter}
                    </div>
                  )}
                </div>

                {/* Score & Actions */}
                <div className="flex flex-col items-end justify-between min-w-[150px] border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                  
                  <div className="text-right w-full flex items-center justify-between md:flex-col md:items-end">
                    <div className="text-sm font-medium text-gray-500 mb-1">Match Score</div>
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold ${
                        app.match_score >= 80 ? 'text-green-500' : 
                        app.match_score >= 50 ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {app.match_score ? app.match_score.toFixed(0) : "0"}
                      </span>
                      <span className="text-lg text-gray-400 font-medium mb-1">%</span>
                    </div>
                  </div>

                  <div className="mt-6 w-full space-y-2">
                    {app.status === 'applied' ? (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'shortlisted')}
                          disabled={updatingStatus === app.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-green-50 text-green-700 hover:bg-green-100 text-sm font-semibold rounded-lg transition-colors"
                        >
                          {updatingStatus === app.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(app.id, 'rejected')}
                          disabled={updatingStatus === app.id}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-red-50 text-red-700 hover:bg-red-100 text-sm font-semibold rounded-lg transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </button>
                      </>
                    ) : (
                      <div className={`w-full text-center py-2 px-3 rounded-lg text-sm font-semibold capitalize ${
                        app.status === 'shortlisted' ? 'bg-green-100 text-green-800' : 
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {app.status}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
};

export default ViewApplications;
