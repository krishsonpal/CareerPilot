import React, { useEffect, useRef, useState } from "react";
import { PlusCircle, Briefcase, MapPin, DollarSign, Calendar, Target, Sparkles, Loader2 } from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

const AddJobs = () => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [location, setLocation] = useState("San Francisco, CA");
  const [isRemote, setIsRemote] = useState(true);
  const [jobType, setJobType] = useState("full-time");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [duration, setDuration] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("entry-level");
  const [loading, setLoading] = useState(false);

  const postJob = async (e) => {
    e.preventDefault();

    if (!title || !description || !skillsRequired) {
      toast.error("Please fill in all required fields.");
      return;
    }

    const skillsArray = skillsRequired
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (skillsArray.length === 0) {
      toast.error("Please enter at least one valid skill tag.");
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post(`/recruiter/jobs`, {
        title,
        description,
        skills_required: skillsArray,
        job_type: jobType,
        location: isRemote ? null : location,
        is_remote: isRemote,
        salary_min: salaryMin ? parseInt(salaryMin) : null,
        salary_max: salaryMax ? parseInt(salaryMax) : null,
        duration: duration || null,
        experience_level: experienceLevel,
        openings: 1,
      });

      if (data.id) {
        toast.success("Job posting created & FAISS semantic indexed!");
        navigate("/dashboard/manage-jobs");
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
        placeholder: "Write a detailed job description, responsibilities, and qualifications here...",
        modules: {
          toolbar: [
            [{ header: [1, 2, false] }],
            ["bold", "italic", "underline"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["clean"],
          ],
        },
      });

      quillRef.current.on("text-change", () => {
        const html = editorRef.current.querySelector(".ql-editor").innerHTML;
        setDescription(html === "<p><br></p>" ? "" : html);
      });
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
          <PlusCircle className="text-indigo-600" size={26} />
          <span>Post a New Job Opportunity</span>
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Your job posting will be vectorized into the FAISS semantic matching database automatically.
        </p>
      </div>

      {/* Form Card */}
      <form onSubmit={postJob} className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Role Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Job Title *
          </label>
          <input
            type="text"
            placeholder="e.g. Senior AI Research Engineer"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
            required
          />
        </div>

        {/* Row 2: Job Type & Experience Level */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Job Type *
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium cursor-pointer"
            >
              <option value="full-time">Full Time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Experience Level *
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium cursor-pointer"
            >
              <option value="entry-level">Entry Level</option>
              <option value="mid-level">Mid Level</option>
              <option value="senior-level">Senior Level</option>
              <option value="lead">Lead / Principal</option>
            </select>
          </div>
        </div>

        {/* Row 3: Salary Min & Salary Max */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Salary Min (USD/year)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                placeholder="100000"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Salary Max (USD/year)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">$</span>
              <input
                type="number"
                placeholder="150000"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        {/* Row 4: Location & Remote Checkbox */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-xs font-bold text-slate-900">Remote Position</p>
              <p className="text-[11px] text-slate-400">Can candidates work from anywhere?</p>
            </div>
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </div>

          {!isRemote && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Office Location
              </label>
              <input
                type="text"
                placeholder="e.g. San Francisco, CA"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
              />
            </div>
          )}
        </div>

        {/* Row 5: Skills Required (Comma-separated) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Skills Required (Comma separated) *
          </label>
          <input
            type="text"
            placeholder="e.g. Python, FastAPI, Docker, PyTorch, SQL, Vector Embeddings"
            value={skillsRequired}
            onChange={(e) => setSkillsRequired(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 outline-none focus:bg-white focus:border-indigo-500 transition-all font-medium"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            These skills feed into the semantic FAISS matching engine to rank candidates.
          </p>
        </div>

        {/* Row 6: Rich Text Description */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Job Description & Responsibilities *
          </label>
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div ref={editorRef} className="h-48" />
          </div>
        </div>

        {/* Submit Action */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate("/dashboard/manage-jobs")}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className={`px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 cursor-pointer ${
              loading ? "opacity-60 cursor-not-allowed" : "active:scale-[0.98]"
            }`}
          >
            {loading ? <Loader2 size={15} className="animate-spin" /> : <PlusCircle size={15} />}
            <span>{loading ? "Publishing Job..." : "Publish Job Posting"}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default AddJobs;
