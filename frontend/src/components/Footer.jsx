import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Github, Twitter, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-white border-t border-slate-200/90 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-100">
          
          {/* Col 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200">
                <span className="text-white font-black text-base">CP</span>
              </div>
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                CareerPilot
              </span>
            </Link>
            <p className="text-sm text-slate-500 max-w-sm leading-relaxed">
              AI-powered smart recruitment & internship matching platform. Connecting top talent with premier companies through multi-vector semantic intelligence.
            </p>
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              <Sparkles size={12} /> Powered by Gemini & FAISS
            </div>
          </div>

          {/* Col 2: Navigation */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">
              Platform
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-600">
              <li>
                <Link to="/all-jobs/all" className="hover:text-indigo-600 transition-colors">
                  Find Jobs
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-indigo-600 transition-colors">
                  About Architecture
                </Link>
              </li>
              <li>
                <Link to="/candidate-login" className="hover:text-indigo-600 transition-colors">
                  AI Career Coach
                </Link>
              </li>
              <li>
                <Link to="/recruiter-login" className="hover:text-indigo-600 transition-colors">
                  For Employers
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Legal & Info */}
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 mb-4">
              Legal & Support
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-slate-600">
              <li>
                <Link to="/terms" className="hover:text-indigo-600 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-indigo-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a href="mailto:support@careerpilot.ai" className="hover:text-indigo-600 transition-colors">
                  support@careerpilot.ai
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} CareerPilot. All rights reserved.</p>
          <p className="flex items-center gap-1 font-medium">
            Designed with state-of-the-art AI architecture
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
