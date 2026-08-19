import { motion } from "framer-motion";
import React, { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { categoryIcon } from "../assets/assets";
import { SlideUp } from "../utils/Animation";

const JobCategory = () => {
  const [activeIndex, setActiveIndex] = useState(null);
  const navigate = useNavigate();

  const handleClick = useCallback(
    (index, name) => {
      setActiveIndex(index);
      setTimeout(() => setActiveIndex(null), 150);
      navigate(`/all-jobs/${encodeURIComponent(name)}`);
      window.scrollTo(0, 0);
    },
    [navigate]
  );

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-50/80 px-3 py-1 rounded-full border border-indigo-100">
            Explore Roles
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-3 mb-2">
            Popular Job Categories
          </h2>
          <p className="text-slate-500 max-w-2xl mx-auto text-sm sm:text-base">
            Discover roles tailored to your tech stack and career aspirations.
          </p>
        </div>

        {/* Grid of Categories */}
        <motion.div
          variants={SlideUp(0.3)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-4"
        >
          {Array.isArray(categoryIcon) &&
            categoryIcon.map((icon, index) => {
              const isActive = activeIndex === index;
              return (
                <div
                  key={index}
                  onClick={() => handleClick(index, icon.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleClick(index, icon.name);
                  }}
                  tabIndex={0}
                  role="button"
                  aria-pressed={isActive}
                  className={`group bg-slate-50/60 hover:bg-white p-5 rounded-2xl border border-slate-200/70 hover:border-indigo-300 shadow-xs hover:shadow-md cursor-pointer transition-all duration-200 flex flex-col items-center text-center hover:-translate-y-1 ${
                    isActive ? "scale-[0.98] bg-indigo-50 border-indigo-300" : ""
                  }`}
                >
                  <div className="w-12 h-12 rounded-xl bg-white shadow-xs border border-slate-100 flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-indigo-50 transition-all">
                    <img
                      className="w-6 h-6 object-contain"
                      src={icon.icon}
                      alt={icon.name}
                      loading="lazy"
                    />
                  </div>
                  <span className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-indigo-600 transition-colors">
                    {icon.name}
                  </span>
                </div>
              );
            })}
        </motion.div>
      </div>
    </section>
  );
};

export default JobCategory;
