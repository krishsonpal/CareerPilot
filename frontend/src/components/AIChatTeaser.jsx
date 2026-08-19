import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Bot, Zap, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { SlideUp } from "../utils/Animation";

const AIChatTeaser = () => {
  const { token, userRole } = useContext(AppContext);
  const navigate = useNavigate();

  const isStudent = token && userRole === "student";

  const targetPath = isStudent ? "/app/assistant" : "/candidate-login?next=/app/assistant";

  const suggestionChips = [
    "What jobs match my resume?",
    "Find remote Python internships",
    "Review my skills gap for Google AI",
  ];

  const handleChipClick = (chip) => {
    navigate(targetPath, { state: { initialPrompt: chip } });
  };

  return (
    <section className="py-18 bg-gradient-to-b from-white to-slate-50 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
            Your AI Career Coach, always ready
          </h2>
          <p className="text-base sm:text-lg text-slate-600">
            Sign in to unlock real-time career guidance, skill gap analysis, and personalized job recommendations.
          </p>
        </div>

        {/* Static Obsidian Preview Card */}
        <motion.div
          variants={SlideUp(0.3)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative rounded-3xl bg-gradient-to-br from-[#0F0A1E] via-[#16102F] to-[#1E123D] border border-violet-800/40 p-6 sm:p-8 shadow-2xl shadow-indigo-950/20 text-white overflow-hidden">
            
            {/* Glow Orbs */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-violet-600/30 border border-violet-400/30 flex items-center justify-center text-violet-300">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    CareerPilot AI
                  </h3>
                  <p className="text-xs text-violet-300/80 font-medium">
                    Powered by FAISS + LangChain + Gemini
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            {/* Suggested Prompt Chips Preview */}
            <div className="relative z-10 mb-6">
              <p className="text-xs font-semibold text-violet-300/70 uppercase tracking-wider mb-2.5">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip)}
                    className="text-xs font-medium bg-white/10 hover:bg-white/15 border border-white/10 hover:border-violet-400/40 text-violet-100 px-3.5 py-2 rounded-xl transition-all text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare size={13} className="text-violet-400 shrink-0" />
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 relative z-10">
              <div className="text-xs text-slate-400">
                <span>Free for candidates • Context-aware to your parsed resume</span>
              </div>
              <Link
                to={targetPath}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-600 hover:from-indigo-600 hover:to-violet-600 text-white text-sm font-bold px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Try free</span>
                <ArrowRight size={16} />
              </Link>
            </div>

          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AIChatTeaser;
