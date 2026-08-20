import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Sparkles, BrainCircuit, ShieldCheck, Zap, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

const AuthLayout = ({
  title,
  subtitle,
  children,
  activeRole = "candidate", // "candidate" | "recruiter"
}) => {
  const location = useLocation();
  const isCandidate = activeRole === "candidate";

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between">
      
      {/* Top Header */}
      <header className="h-18 px-6 sm:px-10 flex items-center justify-between border-b border-border bg-card/70 backdrop-blur-md">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-base shadow-xs group-hover:scale-105 transition-transform">
            CP
          </div>
          <span className="text-xl font-extrabold text-foreground tracking-tight">
            CareerPilot
          </span>
        </Link>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-muted"
        >
          <ArrowLeft size={14} />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Main Split-Screen Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10">
        <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 rounded-3xl border border-border bg-card shadow-lg overflow-hidden">
          
          {/* Left Side: Auth Form Card (7 cols on lg) */}
          <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center">
            
            {/* Role Switcher Pill Tabs */}
            <div className="flex items-center p-1 bg-muted rounded-xl border border-border mb-8 max-w-sm">
              <Link
                to="/candidate-login"
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                  isCandidate
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                I am a Candidate
              </Link>
              <Link
                to="/recruiter-login"
                className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all ${
                  !isCandidate
                    ? "bg-card text-foreground shadow-2xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                I am an Employer
              </Link>
            </div>

            {/* Title & Subtitle */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight">
                {title}
              </h1>
              <p className="text-sm text-muted-foreground mt-1.5">
                {subtitle}
              </p>
            </div>

            {/* Form Children */}
            {children}

          </div>

          {/* Right Side: Supabase Dark Theme AI Showcase Panel (5 cols on lg) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-zinc-950 via-emerald-950 to-zinc-900 text-white p-8 sm:p-10 flex flex-col justify-between relative overflow-hidden border-l border-border">
            
            {/* Ambient Glowing Orbs */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

            {/* Top Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-6">
                <Sparkles size={12} />
                <span>Next-Gen Career Intelligence</span>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold leading-snug mb-3">
                {isCandidate
                  ? "Land your dream engineering role with AI precision."
                  : "Hire top 1% engineering talent without manual resume screening."}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                {isCandidate
                  ? "Multi-vector semantic embeddings match your deep project skills directly to verified job openings."
                  : "Semantic candidate ranking automatically scores and sorts applicants by actual skill relevance."}
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-3 my-8 relative z-10">
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <BrainCircuit size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">FAISS Semantic Vectors</p>
                  <p className="text-[11px] text-zinc-400">Contextual matching beyond keywords</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Zap size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Socket.IO Token Streaming</p>
                  <p className="text-[11px] text-zinc-400">Instant AI Career Coach responses</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">BullMQ Async Extraction</p>
                  <p className="text-[11px] text-zinc-400">Reliable background resume parsing</p>
                </div>
              </div>
            </div>

            {/* Bottom Footer Info */}
            <div className="pt-4 border-t border-white/10 text-[11px] text-zinc-400 flex items-center justify-between relative z-10">
              <span>Encrypted & Confidential</span>
              <span>v2.0 • Supabase Theme</span>
            </div>

          </div>

        </div>
      </main>

      {/* Bottom Legal */}
      <footer className="py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CareerPilot. All rights reserved.
      </footer>

    </div>
  );
};

export default AuthLayout;
