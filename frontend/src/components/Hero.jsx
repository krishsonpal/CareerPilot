import { motion } from "framer-motion";
import { MapPin, Search, Sparkles, Briefcase, Building2 } from "lucide-react";
import React, { useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { SlideUp } from "../utils/Animation";

const Hero = () => {
  const navigate = useNavigate();

  const titleRef = useRef(null);
  const locationRef = useRef(null);

  const { setSearchFilter, setIsSearched } = useContext(AppContext);

  const searchHandler = (e) => {
    e.preventDefault();

    const titleVal = titleRef.current?.value?.trim() || "";
    const locVal = locationRef.current?.value?.trim() || "";

    setSearchFilter({
      title: titleVal,
      location: locVal,
    });

    setIsSearched(true);
    navigate("/all-jobs/all");
  };

  return (
    <section className="relative overflow-hidden pt-12 pb-16 md:pt-16 md:pb-24 bg-gradient-to-b from-indigo-50/50 via-slate-50/30 to-white">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-200/40 via-violet-200/30 to-purple-100/20 blur-3xl pointer-events-none rounded-full" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Top Pill Badge */}
          <motion.div
            variants={SlideUp(0.2)}
            initial="hidden"
            animate="visible"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 shadow-xs mb-6"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-indigo-900 flex items-center gap-1">
              <Sparkles size={12} className="text-indigo-600" />
              AI-Powered Job Matching — Now Live
            </span>
          </motion.div>

          {/* Main Headline */}
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-slate-900 mb-5 tracking-tight leading-[1.15]"
            variants={SlideUp(0.3)}
            initial="hidden"
            animate="visible"
          >
            There Are{" "}
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-700">
              100,000+
            </span>{" "}
            Postings Here For You
          </motion.h1>

          {/* Subtext */}
          <motion.p
            className="text-base sm:text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed"
            variants={SlideUp(0.4)}
            initial="hidden"
            animate="visible"
          >
            Your next career move starts here — powered by semantic AI matching beyond keywords.
          </motion.p>

          {/* Main Search Pill Bar with Surrounding Stat Chips */}
          <motion.div
            variants={SlideUp(0.5)}
            initial="hidden"
            animate="visible"
            className="flex flex-col lg:flex-row items-center justify-center gap-3 w-full"
          >
            {/* Left Stat Chip (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Briefcase size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900 leading-tight">98k+</p>
                <p className="text-[11px] font-medium text-slate-500">Active Jobs</p>
              </div>
            </div>

            {/* Main Interactive Search Pill Container */}
            <form
              onSubmit={searchHandler}
              className="w-full lg:max-w-2xl bg-white rounded-2xl sm:rounded-full p-2 sm:p-2.5 border border-slate-200/90 shadow-md shadow-slate-200/50 flex flex-col sm:flex-row items-center gap-2"
            >
              {/* Job Title Input */}
              <div className="flex items-center px-3.5 py-2 w-full flex-1">
                <Search size={18} className="text-indigo-600 mr-2.5 shrink-0" />
                <input
                  type="text"
                  name="job"
                  placeholder="Job title, skills, company..."
                  aria-label="Job title or skills"
                  autoComplete="off"
                  className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
                  ref={titleRef}
                />
              </div>

              <div className="hidden sm:block w-px h-7 bg-slate-200 shrink-0" />

              {/* Location Input */}
              <div className="flex items-center px-3.5 py-2 w-full flex-1">
                <MapPin size={18} className="text-rose-500 mr-2.5 shrink-0" />
                <input
                  type="text"
                  name="location"
                  placeholder="Location or Remote"
                  aria-label="Location"
                  autoComplete="off"
                  className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
                  ref={locationRef}
                />
              </div>

              {/* Search Button */}
              <button
                type="submit"
                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold py-2.5 sm:py-3 px-7 rounded-xl sm:rounded-full shadow-sm shadow-indigo-200 transition-all hover:shadow-md active:scale-[0.98] text-sm shrink-0 cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Right Stat Chip (Desktop) */}
            <div className="hidden lg:flex items-center gap-2.5 px-4 py-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-sm shrink-0">
              <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <Building2 size={16} />
              </div>
              <div className="text-left">
                <p className="text-sm font-extrabold text-slate-900 leading-tight">12k+</p>
                <p className="text-[11px] font-medium text-slate-500">Companies hiring</p>
              </div>
            </div>
          </motion.div>

          {/* Mobile Stat Chips */}
          <div className="flex lg:hidden items-center justify-center gap-4 mt-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-900">98k+</span> Active Jobs
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-900">12k+</span> Companies
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;
