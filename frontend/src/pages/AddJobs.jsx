import { LoaderCircle, Briefcase, MapPin, DollarSign, Calendar, Target, GraduationCap } from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import React, { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import api from "../utils/api";

const AddJob = () => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [location, setLocation] = useState("Remote");
  const [isRemote, setIsRemote] = useState(true);
  const [jobType, setJobType] = useState("internship");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [duration, setDuration] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry-level");
  const [loading, setLoading] = useState(false);

  const postJob = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!title || !description || !skillsRequired) {
      toast.error("Please fill in all required fields.");
      return;
    }

    // Process skills into array
    const skillsArray = skillsRequired.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
    if (skillsArray.length === 0) {
      toast.error("Please enter at least one valid skill.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(`/jobs`, {
        title,
        description,
        skills_required: skillsArray,
        job_type: jobType,
        location: isRemote ? null : location,
        is_remote: isRemote,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        duration,
        experience_level: experienceLevel,
        openings: 1
      });

      if (data.id) {
        toast.success("Job posted successfully!");
        // Reset form
        setTitle("");
        setSkillsRequired("");
        setSalaryMin("");
        setSalaryMax("");
        setDuration("");
        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to post job");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write a detailed job description here...",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            ['clean']
          ]
        }
      });

      quillRef.current.on("text-change", () => {
        const html = editorRef.current.querySelector(".ql-editor").innerHTML;
        // Don't set state if it's just empty tags
        setDescription(html === "<p><br></p>" ? "" : html);
      });
    }
  }, []);

  return (
    <motion.section 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="p-6 bg-white rounded-2xl shadow-sm border border-gray-100 max-w-5xl"
    >
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Post a New Job</h2>
        <p className="text-gray-500 mt-1">Create a new opening and let AI match you with the best candidates.</p>
      </div>

      <form onSubmit={postJob} className="space-y-8">
        {/* Basic Info Section */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Title *</label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="e.g. Senior Frontend Developer"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 focus:bg-white"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Job Type</label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 focus:bg-white"
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Experience Level</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={experienceLevel}
                  onChange={(e) => setExperienceLevel(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 focus:bg-white appearance-none"
                >
                  <option value="entry-level">Entry Level</option>
                  <option value="mid-level">Mid Level</option>
                  <option value="senior">Senior</option>
                  <option value="executive">Executive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <div className="flex gap-4 items-center mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={isRemote} onChange={() => setIsRemote(true)} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm">Remote</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!isRemote} onChange={() => setIsRemote(false)} className="text-indigo-600 focus:ring-indigo-500" />
                  <span className="text-sm">On-site / Hybrid</span>
                </label>
              </div>
              {!isRemote && (
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 focus:bg-white"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required={!isRemote}
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col justify-end">
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration (If internship/contract)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="e.g. 3 Months, 1 Year"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 focus:bg-white"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Requirements Section */}
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Required Skills *</label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="React, Python, Machine Learning (comma separated)"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-gray-50/50 focus:bg-white"
                value={skillsRequired}
                onChange={(e) => setSkillsRequired(e.target.value)}
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Our AI uses these skills to calculate candidate match scores.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Job Description *</label>
            <div
              className="bg-white rounded-xl overflow-hidden border border-gray-200 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all"
            >
              <div ref={editorRef} style={{ minHeight: "200px", fontSize: "15px" }} />
            </div>
          </div>
        </div>

        <hr className="border-gray-100" />

        {/* Compensation Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Salary Range (Optional)</label>
          <div className="grid grid-cols-2 gap-5">
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                placeholder="Minimum"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 focus:bg-white"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="number"
                placeholder="Maximum"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-gray-50/50 focus:bg-white"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className={`bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-8 font-medium rounded-xl active:scale-[0.98] transition-all flex items-center gap-2 shadow-sm shadow-indigo-200 ${
              loading ? "cursor-not-allowed opacity-70" : "cursor-pointer"
            }`}
          >
            {loading && <LoaderCircle className="animate-spin h-5 w-5" />}
            {loading ? "Publishing Job..." : "Publish Job"}
          </button>
        </div>
      </form>
    </motion.section>
  );
};

export default AddJob;
