import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Edit3, Briefcase, MapPin, DollarSign, Calendar, Target, Sparkles, Loader2, ChevronLeft } from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import { toast } from "react-hot-toast";
import Loader from "../components/Loader";
import api from "../utils/api";

const EditJob = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [initialLoading, setInitialLoading] = useState(true);
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

  // 1. Fetch Job Data on mount
  useEffect(() => {
    const fetchJob = async () => {
      try {
        setInitialLoading(true);
        const { data } = await api.get(`/jobs/${id}`);
        if (data) {
          setTitle(data.title || "");
          setDescription(data.description || "");
          setSkillsRequired(Array.isArray(data.skills_required) ? data.skills_required.join(", ") : "");
          setLocation(data.location || "San Francisco, CA");
          setIsRemote(!!data.is_remote);
          setJobType(data.job_type || "full-time");
          setSalaryMin(data.salary_min ? String(data.salary_min) : "");
          setSalaryMax(data.salary_max ? String(data.salary_max) : "");
          setDuration(data.duration || "");
          setExperienceLevel(data.experience_level || "entry-level");
        }
      } catch (err) {
        toast.error("Failed to fetch job details");
        navigate("/dashboard/manage-jobs");
      } finally {
        setInitialLoading(false);
      }
    };

    if (id) {
      fetchJob();
    }
  }, [id, navigate]);

  // 2. Initialize Quill Editor once loading is complete
  useEffect(() => {
    if (!initialLoading && !quillRef.current && editorRef.current) {
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

      if (description) {
        quillRef.current.root.innerHTML = description;
      }

      quillRef.current.on("text-change", () => {
        const html = editorRef.current.querySelector(".ql-editor").innerHTML;
        setDescription(html === "<p><br></p>" ? "" : html);
      });
    }
  }, [initialLoading]);

  // 3. Save Changes Handler
  const handleUpdateJob = async (e) => {
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
      const { data } = await api.put(`/recruiter/jobs/${id}`, {
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
      });

      if (data.id) {
        toast.success("Job posting updated and re-indexed successfully!");
        navigate("/dashboard/manage-jobs");
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to update job posting");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="py-20 flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header & Back Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/dashboard/manage-jobs")}
          className="p-2 rounded-xl bg-card border border-border text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
            <Edit3 className="text-primary" size={26} />
            <span>Edit Job Posting</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update role details. Changes will automatically update vector embeddings for candidate matching.
          </p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleUpdateJob} className="bg-card border border-border rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        
        {/* Job Title */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Job Title <span className="text-primary">*</span>
          </label>
          <div className="border border-border rounded-xl flex items-center px-4 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Briefcase size={18} className="text-muted-foreground mr-3 shrink-0" />
            <input
              type="text"
              placeholder="e.g. Senior Full Stack Engineer"
              className="w-full outline-none text-sm text-foreground bg-transparent font-medium"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Job Type, Remote, Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Employment Type
            </label>
            <select
              value={jobType}
              onChange={(e) => setJobType(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 bg-input text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="full-time">Full Time</option>
              <option value="internship">Internship</option>
              <option value="contract">Contract</option>
              <option value="part-time">Part Time</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full border border-border rounded-xl px-4 py-3 bg-input text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="entry-level">Entry Level</option>
              <option value="mid-level">Mid Level</option>
              <option value="senior-level">Senior Level</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Workplace Type
            </label>
            <div className="flex items-center gap-2 p-1.5 bg-muted rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setIsRemote(true)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isRemote ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                Remote
              </button>
              <button
                type="button"
                onClick={() => setIsRemote(false)}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !isRemote ? "bg-card text-foreground shadow-2xs" : "text-muted-foreground"
                }`}
              >
                On-Site
              </button>
            </div>
          </div>
        </div>

        {/* Location (if not remote) */}
        {!isRemote && (
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Office Location
            </label>
            <div className="border border-border rounded-xl flex items-center px-4 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <MapPin size={18} className="text-muted-foreground mr-3 shrink-0" />
              <input
                type="text"
                placeholder="e.g. San Francisco, CA / New York, NY"
                className="w-full outline-none text-sm text-foreground bg-transparent font-medium"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Salary Range */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Minimum Salary ($ USD / yr)
            </label>
            <div className="border border-border rounded-xl flex items-center px-4 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <DollarSign size={18} className="text-muted-foreground mr-3 shrink-0" />
              <input
                type="number"
                placeholder="e.g. 80000"
                className="w-full outline-none text-sm text-foreground bg-transparent font-medium"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
              Maximum Salary ($ USD / yr)
            </label>
            <div className="border border-border rounded-xl flex items-center px-4 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
              <DollarSign size={18} className="text-muted-foreground mr-3 shrink-0" />
              <input
                type="number"
                placeholder="e.g. 130000"
                className="w-full outline-none text-sm text-foreground bg-transparent font-medium"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Skills Required */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Required Skills (comma separated) <span className="text-primary">*</span>
          </label>
          <div className="border border-border rounded-xl flex items-center px-4 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
            <Target size={18} className="text-muted-foreground mr-3 shrink-0" />
            <input
              type="text"
              placeholder="e.g. Python, FastAPI, React, PostgreSQL, Docker"
              className="w-full outline-none text-sm text-foreground bg-transparent font-medium"
              value={skillsRequired}
              onChange={(e) => setSkillsRequired(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Rich Job Description */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-2">
            Job Description & Responsibilities <span className="text-primary">*</span>
          </label>
          <div className="bg-card border border-border rounded-2xl overflow-hidden min-h-[220px]">
            <div ref={editorRef} />
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-border flex items-center justify-between gap-4">
          <Link
            to="/dashboard/manage-jobs"
            className="px-5 py-3 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground font-bold text-sm transition-colors"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 py-3 rounded-xl shadow-xs transition-all active:scale-[0.98] text-sm cursor-pointer ${
              loading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Sparkles size={16} />
                <span>Save & Update Job</span>
              </>
            )}
          </button>
        </div>

      </form>

    </div>
  );
};

export default EditJob;
