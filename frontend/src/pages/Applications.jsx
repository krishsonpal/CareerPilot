import { LoaderCircle, FileText, UploadCloud, CheckCircle, BrainCircuit } from "lucide-react";
import moment from "moment";
import React, { useContext, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { motion } from "framer-motion";
import { assets } from "../assets/assets";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";

const Applications = () => {
  const {
    userApplication,
    applicationsLoading,
    fetchUserApplication,
  } = useContext(AppContext);

  const [resumeProfile, setResumeProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  
  const [isEdit, setIsEdit] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const fetchResumeProfile = async () => {
    try {
      setProfileLoading(true);
      const { data } = await api.get(`/ai/resume`);
      setResumeProfile(data);
    } catch (error) {
      if (error?.response?.status !== 404) {
        toast.error("Failed to load resume profile");
      }
      setResumeProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchUserApplication();
    fetchResumeProfile();
  }, []);

  const handleResumeSave = async () => {
    if (!resumeFile) {
      toast.error("Please select a resume file (PDF)");
      return;
    }

    setUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", resumeFile);

      const { data } = await api.post(`/ai/resume/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.id) {
        toast.success("Resume uploaded & analyzed successfully!");
        setResumeProfile(data);
        setIsEdit(false);
        setResumeFile(null);
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Resume upload failed");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="bg-gray-50/50 min-h-screen pt-8 pb-20">
        <section className="container mx-auto px-4 md:px-8 max-w-6xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Resume Profile */}
            <div className="lg:col-span-1 space-y-6">
              
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <BrainCircuit className="h-5 w-5 text-indigo-600" />
                    <h2 className="text-xl font-bold text-gray-900">AI Profile</h2>
                  </div>
                  <p className="text-sm text-gray-500">Your parsed resume data</p>
                </div>

                {profileLoading ? (
                  <div className="py-10 flex justify-center">
                    <LoaderCircle className="animate-spin h-6 w-6 text-indigo-600" />
                  </div>
                ) : (
                  <>
                    {!resumeProfile || isEdit ? (
                      <div className="space-y-4">
                        <div 
                          className="border-2 border-dashed border-indigo-200 rounded-xl p-8 text-center hover:bg-indigo-50/50 transition-colors cursor-pointer"
                          onClick={() => document.getElementById('resume-upload').click()}
                        >
                          <UploadCloud className="h-10 w-10 text-indigo-400 mx-auto mb-3" />
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            {resumeFile ? resumeFile.name : "Click to select resume"}
                          </p>
                          <p className="text-xs text-gray-500">PDF up to 5MB</p>
                          <input
                            id="resume-upload"
                            type="file"
                            hidden
                            accept="application/pdf"
                            onChange={(e) => setResumeFile(e.target.files?.[0] || null)}
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            disabled={!resumeFile || uploadLoading}
                            onClick={handleResumeSave}
                            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all shadow-sm ${
                              !resumeFile || uploadLoading
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200"
                                : "bg-indigo-600 text-white hover:bg-indigo-700 active:scale-[0.98] shadow-indigo-200 cursor-pointer"
                            }`}
                          >
                            {uploadLoading ? (
                              <><LoaderCircle className="animate-spin w-4 h-4" /> Analyzing...</>
                            ) : (
                              "Upload & Parse"
                            )}
                          </button>
                          
                          {resumeProfile && isEdit && (
                            <button
                              onClick={() => { setIsEdit(false); setResumeFile(null); }}
                              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-5">
                        <div className="bg-green-50 border border-green-100 rounded-lg p-3 flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="text-sm font-medium text-green-800">Profile Active</p>
                            <p className="text-xs text-green-600">AI is matching you to jobs</p>
                          </div>
                        </div>

                        {resumeProfile.summary && (
                          <div>
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Summary</h4>
                            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100 line-clamp-4">
                              {resumeProfile.summary}
                            </p>
                          </div>
                        )}

                        {resumeProfile.skills && resumeProfile.skills.length > 0 && (
                          <div className="mb-4">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Top Skills</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {resumeProfile.skills.map(skill => (
                                <span key={skill} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-md font-medium">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex gap-3">
                          {resumeProfile.resume_url && (
                            <a
                              href={import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace('/api', '')}${resumeProfile.resume_url}` : `http://localhost:8000${resumeProfile.resume_url}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 text-center bg-gray-50 border border-gray-200 text-gray-700 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
                            >
                              View PDF
                            </a>
                          )}
                          <button
                            onClick={() => setIsEdit(true)}
                            className="flex-1 py-2 border-2 border-indigo-100 text-indigo-600 rounded-xl text-sm font-medium hover:bg-indigo-50 transition-colors"
                          >
                            Update
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Applications Table */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-xl font-bold text-gray-900">Application History</h2>
                  <p className="text-sm text-gray-500">Track your job applications and status</p>
                </div>

                {applicationsLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <LoaderCircle className="animate-spin h-8 w-8 text-indigo-600" />
                  </div>
                ) : !userApplication || userApplication.length === 0 ? (
                  <div className="text-center py-16 px-6">
                    <div className="bg-gray-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">No applications yet</h3>
                    <p className="text-gray-500">When you apply for jobs, they will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-100">
                      <thead className="bg-gray-50/80">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Company
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Role
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden sm:table-cell">
                            Date Applied
                          </th>
                          <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-50">
                        {[...userApplication].reverse().map((app) => (
                          <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="h-9 w-9 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center p-1.5 flex-shrink-0">
                                  <img
                                    src={assets.company_icon}
                                    alt="Company logo"
                                    className="h-full w-full object-contain"
                                  />
                                </div>
                                <span className="ml-3 text-sm font-semibold text-gray-900">
                                  {app.job?.recruiter?.company_name || "Company"}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{app.job?.title || "Job"}</div>
                              <div className="text-xs text-gray-500 capitalize">{app.job?.job_type || ""}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">
                              {moment(app.applied_at).format("MMM D, YYYY")}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span
                                className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full capitalize ${
                                  app.status === "shortlisted"
                                    ? "bg-green-100 text-green-800"
                                    : app.status === "rejected"
                                    ? "bg-red-100 text-red-800"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {app.status || "applied"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Applications;
