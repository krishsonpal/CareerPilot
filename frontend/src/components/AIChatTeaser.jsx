import React, { useContext } from "react";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Bot, MessageSquare } from "lucide-react";
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
    <section className="py-18 bg-background relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            Your AI Career Coach, always ready
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground">
            Sign in to unlock real-time career guidance, skill gap analysis, and personalized job recommendations.
          </p>
        </div>

        {/* Supabase Dark Obsidian Theme Preview Card */}
        <motion.div
          variants={SlideUp(0.3)}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          <div className="relative rounded-3xl bg-[#121212] border border-[#2a2a2a] p-6 sm:p-8 shadow-2xl text-white overflow-hidden">
            
            {/* Supabase Green Ambient Glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Top Bar */}
            <div className="flex items-center justify-between gap-4 mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    CareerPilot AI
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Powered by FAISS + LangChain + Gemini
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
            </div>

            {/* Suggested Prompt Chips Preview */}
            <div className="relative z-10 mb-6">
              <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
                Suggested questions
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestionChips.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleChipClick(chip)}
                    className="text-xs font-medium bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 text-zinc-200 px-3.5 py-2 rounded-xl transition-all text-left cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageSquare size={13} className="text-emerald-400 shrink-0" />
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* CTA Button Banner */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-white/10 relative z-10">
              <div className="text-xs text-zinc-400">
                <span>Free for candidates • Context-aware to your parsed resume</span>
              </div>
              <Link
                to={targetPath}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-bold px-6 py-2.5 rounded-xl shadow-xs transition-all hover:scale-[1.02] active:scale-[0.98]"
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
