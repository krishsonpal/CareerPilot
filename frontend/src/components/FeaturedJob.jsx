import { motion } from "framer-motion";
import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { AppContext } from "../context/AppContext";
import { SlideUp } from "../utils/Animation";
import JobCard from "./JobCard";
import Loader from "./Loader";

const FeaturedJob = () => {
  const { jobs, jobLoading } = useContext(AppContext);
  const navigate = useNavigate();

  return (
    <section className="py-16 bg-muted/20 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            Latest Openings
          </span>
          <h2 className="text-3xl font-extrabold text-foreground mt-3 mb-2">
            Featured Opportunities
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm sm:text-base">
            Handpicked roles with top tech companies hiring right now.
          </p>
        </div>

        {jobLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader />
          </div>
        ) : !Array.isArray(jobs) || jobs.length === 0 ? (
          <div className="text-center py-12 bg-card rounded-2xl border border-border max-w-md mx-auto">
            <p className="text-muted-foreground font-medium">No job postings available right now.</p>
          </div>
        ) : (
          <>
            <motion.div
              variants={SlideUp(0.3)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid gap-5 grid-cols-1 md:grid-cols-2"
            >
              {[...jobs]
                .reverse()
                .slice(0, 6)
                .map((job, index) => (
                  <JobCard job={job} key={job.id || index} />
                ))}
            </motion.div>

            <motion.div
              variants={SlideUp(0.4)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <button
                onClick={() => {
                  navigate("/all-jobs/all");
                  window.scrollTo(0, 0);
                }}
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 py-3 rounded-xl shadow-xs transition-all active:scale-[0.98] text-sm cursor-pointer"
              >
                <span>Explore All {jobs.length} Jobs</span>
                <ArrowRight size={16} />
              </button>
            </motion.div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedJob;
