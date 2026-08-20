import { CheckCircle2, ArrowRight } from "lucide-react";
import React from "react";
import CountUp from "react-countup";
import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const Counter = () => {
  return (
    <section className="py-20 bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Content Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 mb-16">
          
          {/* Left Image Container */}
          <div className="w-full lg:w-1/2">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/20 rounded-3xl blur-xl" />
              <img
                src={assets.counter_image}
                alt="People collaborating"
                className="relative w-full h-[360px] md:h-[420px] object-cover rounded-2xl shadow-md border border-border"
              />
            </div>
          </div>

          {/* Right Content Container */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20 w-fit mb-3">
              Intelligent Matching
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground mb-5 leading-tight">
              Thousands of Jobs. Find the one that{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-600 to-teal-500">
                fits your profile.
              </span>
            </h2>
            <p className="text-muted-foreground mb-8 text-base leading-relaxed">
              Explore positions indexed with multi-vector semantic embeddings. Upload your resume once and receive curated matches with exact skill fit ratings.
            </p>

            <ul className="space-y-3.5 mb-8">
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={18} />
                <span className="text-foreground text-sm sm:text-base font-medium">
                  Semantic FAISS matching based on deep skills, not just keywords
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={18} />
                <span className="text-foreground text-sm sm:text-base font-medium">
                  Direct AI Career Coach with live token streaming and tailored advice
                </span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle2 className="text-primary shrink-0 mt-0.5" size={18} />
                <span className="text-foreground text-sm sm:text-base font-medium">
                  ATS Kanban application tracking with instant skill gap analysis
                </span>
              </li>
            </ul>

            <Link
              to="/all-jobs/all"
              className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold py-3 px-8 rounded-xl shadow-2xs transition-all active:scale-[0.98] w-fit text-sm"
            >
              <span>Explore Opportunities</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Stats Counter Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-10 border-t border-border">
          <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs text-center">
            <div className="text-4xl font-extrabold text-primary mb-1.5">
              <CountUp start={1} end={89} duration={2.5} enableScrollSpy={true} suffix="k+" />
            </div>
            <p className="text-sm font-bold text-foreground">Active Candidates</p>
            <p className="text-xs text-muted-foreground mt-0.5">Accelerating their tech careers</p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs text-center">
            <div className="text-4xl font-extrabold text-foreground mb-1.5">
              <CountUp start={1} end={100} duration={2.5} enableScrollSpy={true} suffix="k+" />
            </div>
            <p className="text-sm font-bold text-foreground">Job & Internship Postings</p>
            <p className="text-xs text-muted-foreground mt-0.5">Across engineering, AI, & design</p>
          </div>

          <div className="bg-card p-6 rounded-2xl border border-border shadow-2xs text-center">
            <div className="text-4xl font-extrabold text-primary mb-1.5">
              <CountUp start={1} end={12} duration={2.5} enableScrollSpy={true} suffix="k+" />
            </div>
            <p className="text-sm font-bold text-foreground">Hiring Companies</p>
            <p className="text-xs text-muted-foreground mt-0.5">From seed startups to enterprise</p>
          </div>
        </div>

      </div>
    </section>
  );
};

export default Counter;
