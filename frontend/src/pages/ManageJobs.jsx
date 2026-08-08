import React, { useEffect, useState } from "react";
import moment from "moment";
import { toast } from "react-hot-toast";
import { LoaderCircle, Briefcase, Users, Eye, MoreVertical } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const ManageJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    setLoading(true);
    try {
      // The recruiter routes include /recruiter/jobs
      const { data } = await api.get(`/recruiter/jobs`);
      setJobs(data || []);
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to fetch your jobs");
    } finally {
      setLoading(false);
    }
  };

  const toggleJobStatus = async (jobId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "closed" : "active";
    try {
      const { data } = await api.put(`/recruiter/jobs/${jobId}`, {
        status: newStatus
      });
      if (data.id) {
        toast.success(`Job marked as ${newStatus}`);
        setJobs(jobs.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
      }
    } catch (error) {
      toast.error("Failed to update job status");
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  if (loading) {
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manage Postings</h2>
          <p className="text-gray-500 mt-1">View your jobs, track applicants, and manage visibility.</p>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
          <Briefcase className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900">No jobs posted yet</h3>
          <p className="text-gray-500 mt-1">Create your first job posting to start receiving applicants.</p>
          <button 
            onClick={() => navigate('/dashboard/add-job')}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Post a Job
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/80">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Job Role
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Type / Location
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date Posted
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Applicants
                </th>
                <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 rounded-lg bg-indigo-50 flex items-center justify-center border border-indigo-100">
                        <Briefcase className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-semibold text-gray-900">{job.title}</div>
                        <div className="text-xs text-gray-500 capitalize">{job.experience_level || "Entry Level"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 capitalize">{job.job_type}</div>
                    <div className="text-xs text-gray-500">
                      {job.is_remote ? "Remote" : (job.location || "On-site")}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{moment(job.created_at).format("MMM D, YYYY")}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <button 
                      onClick={() => navigate(`/dashboard/view-applications?job_id=${job.id}`)}
                      className="inline-flex items-center justify-center px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold hover:bg-indigo-100 transition-colors"
                    >
                      <Users className="w-3 h-3 mr-1" />
                      View Applicants
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={job.status === "active"}
                        onChange={() => toggleJobStatus(job.id, job.status)}
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-green-500"></div>
                      <span className="ml-2 text-xs font-medium text-gray-600">
                        {job.status === "active" ? "Active" : "Closed"}
                      </span>
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </motion.section>
  );
};

export default ManageJobs;
