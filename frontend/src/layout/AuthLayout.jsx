import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Bot, Cpu, FileText, ArrowLeft } from "lucide-react";

const AuthLayout = ({ children, title, subtitle, activeRole, onRoleChange }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center">
      <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Form Area (7 cols on lg) */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-6 sm:p-10 md:p-14 lg:p-12 xl:p-16 bg-white z-10">
          
          {/* Top Bar with Brand & Back Link */}
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <span className="text-white font-black text-base">CP</span>
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                CareerPilot
              </span>
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg"
            >
              <ArrowLeft size={14} /> Back to Home
            </Link>
          </div>

          {/* Center Form Container */}
          <div className="w-full max-w-md mx-auto my-auto py-4">
            
            {/* Role Switcher Tabs */}
            {onRoleChange && (
              <div className="flex items-center p-1 bg-slate-100/80 rounded-2xl mb-8 border border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onRoleChange("candidate")}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    activeRole === "candidate"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  I am a Candidate
                </button>
                <button
                  type="button"
                  onClick={() => onRoleChange("recruiter")}
                  className={`flex-1 py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer ${
                    activeRole === "recruiter"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  I am an Employer
                </button>
              </div>
            )}

            {/* Header */}
            <div className="mb-7">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
                {title}
              </h1>
              <p className="text-sm text-slate-500">
                {subtitle}
              </p>
            </div>

            {/* Form Slot */}
            {children}
          </div>

          {/* Footer Note */}
          <div className="mt-8 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
            © {new Date().getFullYear()} CareerPilot AI. Secured with JWT and role verification.
          </div>
        </div>

        {/* Right Visual Panel (5 cols on lg) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative bg-gradient-to-br from-[#4F46E5] via-[#6366F1] to-[#2E1065] p-12 xl:p-16 flex-col justify-between overflow-hidden text-white">
          
          {/* Ambient Glows */}
          <div className="absolute top-10 right-10 w-96 h-96 bg-violet-400/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl pointer-events-none" />
          
          {/* Subtle Grid / Neural Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />

          {/* Top Pill */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-bold text-white shadow-xs">
              <Sparkles size={13} className="text-violet-200" />
              <span>Next-Gen Recruitment AI</span>
            </div>
            <div className="text-xs text-violet-200/80 font-medium">
              v2.0 Platform
            </div>
          </div>

          {/* Center Floating Glass Badges Showcase (Matching photos/auth_portal.jpg) */}
          <div className="relative z-10 max-w-lg mx-auto w-full my-auto py-10 space-y-5">
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:bg-white/15 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-violet-500/30 border border-violet-300/30 flex items-center justify-center text-violet-200 shrink-0">
                <Cpu size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>✦ FAISS Semantic Job Matching</span>
                </h3>
                <p className="text-xs text-violet-200/80 mt-0.5">
                  Multi-vector embeddings match skills and experience beyond simple keywords.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:bg-white/15 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/30 border border-emerald-300/30 flex items-center justify-center text-emerald-200 shrink-0">
                <Bot size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>✦ Real-time Streaming AI Career Coach</span>
                </h3>
                <p className="text-xs text-violet-200/80 mt-0.5">
                  Socket.IO + LangChain token streaming for live resume gap advice.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.5 }}
              className="bg-white/10 backdrop-blur-xl border border-white/20 p-5 rounded-2xl shadow-xl flex items-center gap-4 hover:bg-white/15 transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-400/30 border border-indigo-300/30 flex items-center justify-center text-indigo-200 shrink-0">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <span>✦ Async Resume Extraction Pipeline</span>
                </h3>
                <p className="text-xs text-violet-200/80 mt-0.5">
                  Automated background BullMQ workers parse PDF profiles via Gemini 3.1.
                </p>
              </div>
            </motion.div>

          </div>

          {/* Bottom Testimonial / Stat */}
          <div className="relative z-10 flex items-center justify-between pt-6 border-t border-white/10 text-xs text-violet-200">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>100,000+ Postings & Profiles Indexed</span>
            </div>
            <span>Trusted by leading companies</span>
          </div>

        </div>

      </div>
    </div>
  );
};

export default AuthLayout;
