import React, { useContext, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Briefcase,
  PlusCircle,
  Users,
  LogOut,
  Bell,
  Building2,
  Sparkles,
  Menu,
  X,
  ChevronRight
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { AppContext } from "../context/AppContext";

const RecruiterLayout = () => {
  const { userData, logout } = useContext(AppContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navItems = [
    {
      name: "Manage Postings",
      path: "/dashboard/manage-jobs",
      icon: Briefcase,
    },
    {
      name: "Post a Job",
      path: "/dashboard/add-job",
      icon: PlusCircle,
    },
    {
      name: "View Applications",
      path: "/dashboard/view-applications",
      icon: Users,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-row">
      
      {/* Desktop Sidebar (Matching Screen 3 white/indigo theme) */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200/80 flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
        <div>
          {/* Brand */}
          <div className="h-18 flex items-center px-6 border-b border-slate-100">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 rounded-xl flex items-center justify-center shadow-md text-white font-black text-base group-hover:scale-105 transition-transform">
                CP
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                  CareerPilot
                </span>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                  Employer Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                      isActive
                        ? "bg-slate-900 text-white shadow-md shadow-slate-900/20 font-bold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={`transition-colors ${
                          isActive ? "text-white" : "text-slate-400 group-hover:text-slate-900"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom Company Profile & Logout */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {userData?.company_name?.charAt(0) || "C"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">
                  {userData?.company_name || userData?.name || "Company"}
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  {userData?.email || "Employer"}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-indigo-600" />
            <span>AI ATS Evaluator Online</span>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 w-64 bg-white min-h-screen shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="h-18 flex items-center justify-between px-6 border-b border-slate-100">
                  <span className="text-lg font-extrabold text-slate-900">CareerPilot</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-400">
                    <X size={20} />
                  </button>
                </div>
                <nav className="p-4 space-y-1.5">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold ${
                          isActive ? "bg-slate-900 text-white font-bold" : "text-slate-600"
                        }`
                      }
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </NavLink>
                  ))}
                </nav>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        
        {/* Recruiter Topbar */}
        <header className="h-18 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider">
                Recruitment Dashboard
              </span>
              <p className="text-sm font-bold text-slate-900">
                {userData?.company_name || "Company Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/add-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <PlusCircle size={14} />
              <span>Post New Role</span>
            </Link>

            <button
              title="Notifications"
              className="p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Dynamic Outlet */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default RecruiterLayout;
