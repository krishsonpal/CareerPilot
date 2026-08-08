import kConverter from "k-convert";
import { Clock, MapPin, User, Building2, Briefcase, DollarSign, Calendar } from "lucide-react";
import moment from "moment";
import React from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";

const JobCard = ({ job }) => {
  const navigate = useNavigate();

  const id = job.id || job._id;
  
  // Salary formatting
  const formatSalary = () => {
    if (job.salary_min && job.salary_max) {
      return `$${kConverter.convertTo(job.salary_min)} - $${kConverter.convertTo(job.salary_max)}`;
    }
    if (job.salary_min) return `$${kConverter.convertTo(job.salary_min)}`;
    if (job.stipend) return job.stipend; // Legacy fallback
    return "Not disclosed";
  };

  return (
    <div
      onClick={() => {
        if (id) {
          navigate(`/apply-job/${id}`);
          window.scrollTo(0, 0);
        }
      }}
      className="bg-white p-5 rounded-2xl border border-gray-100 hover:border-indigo-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col md:flex-row gap-5 relative overflow-hidden"
    >
      {/* Decorative gradient blob */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-indigo-50 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Company Logo */}
      <div className="flex-shrink-0">
        <div className="w-14 h-14 bg-gray-50 rounded-xl border border-gray-100 flex items-center justify-center p-2 group-hover:scale-105 transition-transform">
          <img
            className="w-full h-full object-contain"
            src={job.recruiter?.company_name ? assets.company_icon : assets.company_icon} 
            alt="Company Logo"
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <h1 className="text-lg text-gray-900 font-bold group-hover:text-indigo-600 transition-colors line-clamp-1">
            {job.title}
          </h1>
          <span className="inline-flex text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md whitespace-nowrap self-start">
            {job.job_type === 'internship' ? 'Internship' : job.job_type === 'full-time' ? 'Full Time' : job.job_type || 'Job'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-gray-500 mb-4">
          <div className="flex items-center gap-1.5 font-medium text-gray-700">
            <Building2 size={15} className="text-gray-400" />
            <span>{job.recruiter?.company_name || "Confidential"}</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <MapPin size={15} className="text-gray-400" />
            <span>{job.is_remote ? "Remote" : (job.location || "On-site")}</span>
          </div>
          
          <div className="flex items-center gap-1.5 capitalize">
            <User size={15} className="text-gray-400" />
            <span>{job.experience_level?.replace('-', ' ') || "Entry Level"}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <DollarSign size={15} className="text-gray-400" />
            <span>{formatSalary()}</span>
          </div>
          
          {job.duration && (
            <div className="flex items-center gap-1.5">
              <Calendar size={15} className="text-gray-400" />
              <span>{job.duration}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div className="flex flex-wrap gap-1.5">
            {(job.skills_required || []).slice(0, 3).map(skill => (
              <span key={skill} className="px-2 py-0.5 bg-gray-50 text-gray-600 text-xs rounded border border-gray-100">
                {skill}
              </span>
            ))}
            {(job.skills_required?.length || 0) > 3 && (
              <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-xs rounded border border-gray-100">
                +{job.skills_required.length - 3}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium">
            <Clock size={13} />
            <span>{moment(job.created_at || job.date).fromNow()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCard;
