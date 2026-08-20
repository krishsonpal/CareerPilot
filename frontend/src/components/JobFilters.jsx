import React from "react";
import { Filter, RotateCcw, Check } from "lucide-react";
import { JobCategories, JobLocations } from "../assets/assets";

const JobFilters = ({
  selectedCategories = [],
  setSelectedCategories,
  selectedLocations = [],
  setSelectedLocations,
  selectedRoleType = "all",
  setSelectedRoleType,
  isRemoteOnly = false,
  setIsRemoteOnly,
  onResetFilters,
}) => {
  const toggleCategory = (cat) => {
    if (selectedCategories.includes(cat)) {
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
  };

  const toggleLocation = (loc) => {
    if (selectedLocations.includes(loc)) {
      setSelectedLocations(selectedLocations.filter((l) => l !== loc));
    } else {
      setSelectedLocations([...selectedLocations, loc]);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-6">
      
      {/* Top Filter Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-primary" />
          <h3 className="text-sm font-bold text-foreground">Filters</h3>
        </div>

        <button
          onClick={onResetFilters}
          className="text-xs font-semibold text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Role Type Filter */}
      <div>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
          Role Type
        </h4>
        <div className="space-y-1.5 text-xs font-semibold text-foreground">
          {[
            { label: "All Roles", value: "all" },
            { label: "Full Time", value: "full-time" },
            { label: "Internships", value: "internship" },
            { label: "Contract", value: "contract" },
          ].map((type) => (
            <label
              key={type.value}
              className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-muted cursor-pointer"
            >
              <input
                type="radio"
                name="roleType"
                value={type.value}
                checked={selectedRoleType === type.value}
                onChange={() => setSelectedRoleType(type.value)}
                className="w-4 h-4 text-primary accent-primary cursor-pointer"
              />
              <span>{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Remote Only Toggle */}
      <div className="pt-3 border-t border-border">
        <label className="flex items-center justify-between p-2 bg-muted/50 rounded-xl cursor-pointer">
          <span className="text-xs font-bold text-foreground">Remote Only</span>
          <input
            type="checkbox"
            checked={isRemoteOnly}
            onChange={(e) => setIsRemoteOnly(e.target.checked)}
            className="w-4 h-4 text-primary accent-primary rounded cursor-pointer"
          />
        </label>
      </div>

      {/* Categories Multi-Select */}
      <div className="pt-3 border-t border-border">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
          Categories ({selectedCategories.length})
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 text-xs font-medium text-foreground">
          {JobCategories.map((cat, idx) => {
            const isChecked = selectedCategories.includes(cat);
            return (
              <label
                key={idx}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCategory(cat)}
                    className="w-3.5 h-3.5 text-primary accent-primary rounded cursor-pointer shrink-0"
                  />
                  <span className="truncate">{cat}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Locations Multi-Select */}
      <div className="pt-3 border-t border-border">
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground mb-3">
          Top Locations ({selectedLocations.length})
        </h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 text-xs font-medium text-foreground">
          {JobLocations.map((loc, idx) => {
            const isChecked = selectedLocations.includes(loc);
            return (
              <label
                key={idx}
                className="flex items-center justify-between p-1.5 rounded-lg hover:bg-muted cursor-pointer"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleLocation(loc)}
                    className="w-3.5 h-3.5 text-primary accent-primary rounded cursor-pointer shrink-0"
                  />
                  <span className="truncate">{loc}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

    </div>
  );
};

export default JobFilters;
