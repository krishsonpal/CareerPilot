import axios from "axios";
import { LoaderCircle } from "lucide-react";
import Quill from "quill";
import "quill/dist/quill.snow.css";
import React, { useContext, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { AppContext } from "../context/AppContext";

const AddJob = () => {
  const editorRef = useRef(null);
  const quillRef = useRef(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsRequired, setSkillsRequired] = useState("");
  const [location, setLocation] = useState("Dhaka");
  const [stipend, setStipend] = useState("");
  const [duration, setDuration] = useState("");
  const [loading, setLoading] = useState(false);

  const { backendUrl, companyToken } = useContext(AppContext);

  const postJob = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await axios.post(
        `${backendUrl}/company/add_internship/`,
        {
          title,
          description,
          skills_required: skillsRequired,
          location,
          stipend,
          duration,
        },
        {
          headers: { Authorization: `Bearer ${companyToken}` },
        }
      );

      if (data.message) {
        toast.success(data.message);
        setTitle("");
        setDescription("");
        setSkillsRequired("");
        setLocation("Dhaka");
        setStipend("");
        setDuration("");

        if (quillRef.current) {
          quillRef.current.root.innerHTML = "";
        }
      } else {
        toast.error("Failed to add internship");
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!quillRef.current && editorRef.current) {
      quillRef.current = new Quill(editorRef.current, {
        theme: "snow",
        placeholder: "Write job description here...",
      });

      quillRef.current.on("text-change", () => {
        const html = editorRef.current.querySelector(".ql-editor").innerHTML;
        setDescription(html);
      });
    }
  }, []);

  useEffect(() => {
    document.title = "PM internship Portal | Dashboard";
  }, []);

  return (
    <section className="mr-1 mb-6">
      <form onSubmit={postJob}>
        {/* Job Title */}
        <div className="mb-6">
          <label className="block text-gray-800 text-lg font-semibold mb-3 pb-1 border-b border-gray-200">
            Job Title
          </label>
          <input
            type="text"
            placeholder="Enter job title"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        {/* Job Description */}
        <div className="mb-6">
          <label className="block text-gray-800 text-lg font-semibold mb-3 pb-1 border-b border-gray-200">
            Job Description
          </label>
          <div
            ref={editorRef}
            style={{
              minHeight: "150px",
              border: "1px solid #ccc",
              borderRadius: "8px",
              padding: "10px",
            }}
          />
        </div>

        {/* Skills Required */}
        <div className="mb-6">
          <label className="block text-gray-800 text-lg font-semibold mb-3 pb-1 border-b border-gray-200">
            Skills Required
          </label>
          <input
            type="text"
            placeholder="Enter required skills (comma separated)"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={skillsRequired}
            onChange={(e) => setSkillsRequired(e.target.value)}
            required
          />
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Job Location */}
          <div>
            <label className="block text-gray-800 text-lg font-semibold mb-3 pb-1 border-b border-gray-200">
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="Dhaka">Dhaka</option>
              <option value="Rangpur">Rangpur</option>
              <option value="Barishal">Barishal</option>
              <option value="Khulna">Khulna</option>
              <option value="Mymensingh">Mymensingh</option>
              <option value="Rajshahi">Rajshahi</option>
              <option value="Sylhet">Sylhet</option>
              <option value="Remote">Remote</option>
            </select>
          </div>

          {/* Stipend */}
          <div>
            <label className="block text-gray-800 text-lg font-semibold mb-3 pb-1 border-b border-gray-200">
              Stipend
            </label>
            <input
              type="text"
              placeholder="Enter stipend amount"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={stipend}
              onChange={(e) => setStipend(e.target.value)}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-gray-800 text-lg font-semibold mb-3 pb-1 border-b border-gray-200">
              Duration
            </label>
            <input
              type="text"
              placeholder="e.g., 3 months, 6 months"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-8 font-semibold rounded ${
            loading ? "cursor-not-allowed opacity-50" : "cursor-pointer"
          }`}
        >
          {loading ? (
            <LoaderCircle className="animate-spin h-5 w-5 mx-auto" />
          ) : (
            "Add Job"
          )}
        </button>
      </form>
    </section>
  );
};

export default AddJob;
