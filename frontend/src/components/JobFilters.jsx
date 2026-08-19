import React from "react";
import { Filter, RotateCcw, Check } from "lucide-react";

const CATEGORIES = [
  "Backend",
  "AI/ML",
  "Data Science",
  "DevOps",
  "Frontend",
  "Full Stack",
  "Mobile",
];

const EXPERIENCE_LEVELS = [
  { label: "Entry Level", value: "entry-level" },
  { label: "Mid Level", value: "mid-level" },
  { label: "Senior Level", value: "senior-level" },
  { label: "Lead / Principal", value: "lead" },
];

const SALARY_RANGES = [
  { label: "$60k - $100k", min: 60000, max: 100000 },
  { label: "$100k - $130k", min: 100000, max: 130000 },
  { label: "$130k - $160k", min: 130000, max: 160000 },
  { label: "$160k+", min: 160000, max: 999999 },
];

const JOB_TYPES = [
  { label: "Full-time", value: "full-time" },
  { label: "Internship", value: "internship" },
  { label: "Contract", value: "contract" },
];

const JobFilters = ({ filters, setFilters, onReset }) => {
  const toggleCategory = (cat) => {
    setFilters((prev) => {
      const exists = prev.categories.includes(cat);
      return {
        ...prev,
        categories: exists
          ? prev.categories.filter((c) => c !== cat)
          : [...prev.categories, cat],
      };
    });
  };

  const toggleExperience = (exp) => {
    setFilters((prev) => {
      const exists = prev.experienceLevels.includes(exp);
      return {
        ...prev,
        experienceLevels: exists
          ? prev.experienceLevels.filter((e) => e !== exp)
          : [...prev.experienceLevels, exp],
      };
    });
  };

  const toggleSalary = (idx) => {
    setFilters((prev) => ({
      ...prev,
      selectedSalaryIdx: prev.selectedSalaryIdx === idx ? null : idx,
    }));
  };

  const toggleJobType = (type) => {
    setFilters((prev) => {
      const exists = prev.jobTypes.includes(type);
      return {
        ...prev,
        jobTypes: exists
          ? prev.jobTypes.filter((t) => t !== type)
          : [...prev.jobTypes, type],
      };
    });
  };

  const toggleRemote = () => {
    setFilters((prev) => ({
      ...prev,
      remoteOnly: !prev.remoteOnly,
    }));
  };

  const hasActiveFilters =
    filters.categories.length > 0 ||
    filters.experienceLevels.length > 0 ||
    filters.selectedSalaryIdx !== null ||
    filters.jobTypes.length > 0 ||
    filters.remoteOnly;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-6">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-indigo-600" />
          <h3 className="text-sm font-bold text-slate-900">Filters</h3>
        </div>

        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 hover:underline cursor-pointer"
          >
            <RotateCcw size={12} /> Reset
          </button>
        )}
      </div>

      {/* 1. Remote Only Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200/70">
        <div>
          <span className="text-xs font-bold text-slate-900 block">Remote Only</span>
          <span className="text-[11px] text-slate-400">Work from anywhere</span>
        </div>
        <button
          type="button"
          onClick={toggleRemote}
          className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer ${
            filters.remoteOnly ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              filters.remoteOnly ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>

      {/* 2. Categories Checkboxes */}
      <div>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Categories
        </h4>
        <div className="space-y-2">
          {CATEGORIES.map((cat) => {
            const checked = filters.categories.includes(cat);
            return (
              <label
                key={cat}
                className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(cat)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{cat}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 3. Experience Level */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Experience Level
        </h4>
        <div className="space-y-2">
          {EXPERIENCE_LEVELS.map((exp) => {
            const checked = filters.experienceLevels.includes(exp.value);
            return (
              <label
                key={exp.value}
                className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleExperience(exp.value)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{exp.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Salary Range */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Salary Range
        </h4>
        <div className="space-y-2">
          {SALARY_RANGES.map((sal, idx) => {
            const checked = filters.selectedSalaryIdx === idx;
            return (
              <label
                key={idx}
                className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                <input
                  type="radio"
                  name="salary_filter"
                  checked={checked}
                  onChange={() => toggleSalary(idx)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{sal.label}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Job Type */}
      <div className="pt-4 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
          Job Type
        </h4>
        <div className="space-y-2">
          {JOB_TYPES.map((type) => {
            const checked = filters.jobTypes.includes(type.value);
            return (
              <label
                key={type.value}
                className="flex items-center gap-2.5 text-xs text-slate-600 hover:text-slate-900 cursor-pointer font-medium"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleJobType(type.value)}
                  className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
                <span>{type.label}</span>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default JobFilters;
