import kConverter from "k-convert";
import { Clock, MapPin, Building2, User, DollarSign, Calendar, ChevronRight, Briefcase, FileText } from "lucide-react";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import Loader from "../components/Loader";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";

const ApplyJob = () => {
  const [jobData, setJobData] = useState(null);
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [noSimilarJobs, setNoSimilarJobs] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  const navigate = useNavigate();
  const { id } = useParams();
  
  const {
    jobs,
    jobLoading,
    token,
    userRole,
    userData,
    userApplication = [],
    fetchUserApplication
  } = useContext(AppContext);

  const isStudent = token && userRole === "student";

  const applyJobHandler = async () => {
    if (!isStudent) {
      toast.error("Please login as a candidate to apply");
      navigate("/candidate-login");
      return;
    }
    if (userData && !userData.has_resume_summary) {
      toast.error("Please upload your resume in your Profile first");
      navigate("/applications");
      return;
    }

    setIsApplying(true);
    try {
      const { data } = await api.post(`/applications`, {
        job_id: id,
        cover_letter: coverLetter
      });

      if (data.id) {
        toast.success("Application submitted successfully!");
        setAlreadyApplied(true);
        fetchUserApplication(); // Refresh global application state
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to apply");
    } finally {
      setIsApplying(false);
    }
  };

  useEffect(() => {
    if (jobs && id) {
      const data = jobs.find((job) => String(job.id) === String(id));
      setJobData(data);
    } else if (!jobs.length && id) {
      // Fallback if accessed directly and jobs not loaded yet
      api.get(`/jobs/${id}`).then(res => setJobData(res.data)).catch(() => navigate('/'));
    }
  }, [id, jobs]);

  useEffect(() => {
    if (userApplication?.length > 0 && jobData) {
      const hasApplied = userApplication.some((item) => item?.job_id === jobData?.id);
      setAlreadyApplied(hasApplied);
    }
  }, [jobData, userApplication]);

  useEffect(() => {
    if (jobs && jobData) {
      const similarJobs = jobs.filter(
        (job) =>
          job.id !== jobData?.id &&
          job.recruiter?.company_name === jobData?.recruiter?.company_name
      );
      setNoSimilarJobs(similarJobs.length === 0);
    }
  }, [jobData, jobs]);

  const formatSalary = (min, max) => {
    if (min && max) return `$${kConverter.convertTo(min)} - $${kConverter.convertTo(max)}`;
    if (min) return `$${kConverter.convertTo(min)}`;
    return "Not disclosed";
  };

  if (jobLoading || !jobData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
        <Loader />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bg-gray-50/50 min-h-screen pt-8 pb-20">
        <section className="container mx-auto px-4 md:px-8 max-w-6xl">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
            <span className="cursor-pointer hover:text-indigo-600" onClick={() => navigate('/all-jobs/all')}>All Jobs</span>
            <ChevronRight className="h-4 w-4" />
            <span className="capitalize">{jobData.job_type}</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-gray-900 font-medium truncate">{jobData.title}</span>
          </div>

          {/* Hero Header */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white border border-gray-200 rounded-2xl p-8 mb-8 shadow-sm flex flex-col lg:flex-row gap-8 lg:items-center justify-between relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/80 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center z-10">
              <div className="w-24 h-24 flex-shrink-0 bg-white border border-gray-100 rounded-2xl flex items-center justify-center p-4 shadow-sm">
                <img
                  src={assets.company_icon}
                  alt={jobData?.recruiter?.company_name || "Company"}
                  className="w-full h-full object-contain"
                />
              </div>
              
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold text-gray-900">{jobData.title}</h1>
                  <span className="inline-flex text-xs font-bold uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-md">
                    {jobData.job_type}
                  </span>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-gray-600 mt-4">
                  <div className="flex items-center gap-2 font-medium text-gray-800">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    <span>{jobData?.recruiter?.company_name || "Confidential"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{jobData.is_remote ? "Remote" : (jobData.location || "On-site")}</span>
                  </div>
                  <div className="flex items-center gap-2 capitalize">
                    <User className="w-5 h-5 text-gray-400" />
                    <span>{jobData.experience_level?.replace('-', ' ') || "Entry Level"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-gray-400" />
                    <span>{formatSalary(jobData.salary_min, jobData.salary_max)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 z-10 min-w-[200px]">
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 mb-2">
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span>Posted {moment(jobData.created_at).fromNow()}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Briefcase className="w-4 h-4" />
                  <span>{jobData.openings || 1} Openings</span>
                </div>
              </div>
              
              {alreadyApplied ? (
                <button className="w-full bg-green-50 text-green-700 font-semibold py-3 px-6 rounded-xl cursor-not-allowed border border-green-200">
                  Application Sent
                </button>
              ) : (
                <a href="#apply-section" className="w-full text-center bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-sm shadow-indigo-200">
                  Apply Now
                </a>
              )}
            </div>
          </motion.div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            <div className="lg:col-span-2 space-y-8">
              
              {/* Job Description */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm"
              >
                <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  About the Role
                </h2>
                
                <div
                  className="prose prose-indigo max-w-none text-gray-600 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: jobData.description }}
                />

                <hr className="my-8 border-gray-100" />

                <h2 className="text-lg font-bold text-gray-900 mb-4">Required Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {(jobData.skills_required || []).map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-sm font-medium rounded-lg border border-gray-200">
                      {skill}
                    </span>
                  ))}
                </div>
              </motion.div>

              {/* Apply Section */}
              <motion.div 
                id="apply-section"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-white border border-indigo-100 rounded-2xl p-8 shadow-sm relative overflow-hidden"
              >
                {/* Decorative blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -z-10"></div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-2">Submit Your Application</h2>
                <p className="text-gray-500 mb-6 text-sm">Our AI will match your uploaded resume against this job's requirements.</p>

                {alreadyApplied ? (
                  <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center font-medium">
                    You have already applied for this position. We will notify you of any updates!
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cover Letter (Optional)</label>
                      <textarea 
                        rows="4" 
                        placeholder="Tell the recruiter why you're a great fit..."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                        value={coverLetter}
                        onChange={(e) => setCoverLetter(e.target.value)}
                      ></textarea>
                    </div>

                    <button
                      onClick={applyJobHandler}
                      disabled={isApplying}
                      className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                        isApplying 
                          ? "bg-indigo-400 text-white cursor-wait" 
                          : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200 active:scale-[0.99]"
                      }`}
                    >
                      {isApplying ? "Submitting Application..." : "Submit Application"}
                    </button>
                    
                    {!isStudent && (
                      <p className="text-center text-xs text-gray-500 mt-2">
                        You will be asked to log in or create a candidate account.
                      </p>
                    )}
                  </div>
                )}
              </motion.div>

            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                
                {/* Company Info summary could go here */}

                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h2 className="text-lg font-bold text-gray-900 mb-4">
                    Other Jobs at <span className="text-indigo-600">{jobData?.recruiter?.company_name || "Company"}</span>
                  </h2>
                  <div className="space-y-4">
                    {noSimilarJobs ? (
                      <p className="text-gray-500 text-sm p-4 bg-gray-50 rounded-xl border border-gray-100 text-center">
                        No other jobs available right now.
                      </p>
                    ) : (
                      jobs
                        .filter(
                          (job) =>
                            job.id !== jobData?.id &&
                            job.recruiter?.company_name === jobData?.recruiter?.company_name
                        )
                        .filter((job) => {
                          const appliedJobsId = new Set(userApplication?.map((app) => app.job_id));
                          return !appliedJobsId.has(job.id);
                        })
                        .slice(0, 3)
                        .map((job) => (
                          // Simplified small job card for sidebar
                          <div 
                            key={job.id} 
                            onClick={() => { navigate(`/apply-job/${job.id}`); window.scrollTo(0,0); }}
                            className="p-3 border border-gray-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-colors"
                          >
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">{job.title}</h4>
                            <p className="text-xs text-gray-500 capitalize">{job.job_type} • {job.is_remote ? "Remote" : (job.location || "On-site")}</p>
                          </div>
                        ))
                    )}
                  </div>
                </div>

              </div>
            </div>

          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default ApplyJob;
