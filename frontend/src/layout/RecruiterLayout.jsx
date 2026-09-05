import React, { useContext, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Briefcase,
  PlusCircle,
  Users,
  LogOut,
  Bell,
  Sparkles,
  Menu,
  X,
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
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-row">
      
      {/* Desktop Sidebar (Supabase Theme) */}
      <aside className="hidden lg:flex w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
        <div>
          {/* Brand */}
          <div className="h-18 flex items-center px-6 border-b border-sidebar-border">
            <Link to="/dashboard/manage-jobs" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-base shadow-xs group-hover:scale-105 transition-transform">
                CP
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-extrabold text-foreground tracking-tight leading-tight">
                  CareerPilot
                </span>
                <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
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
                        ? "bg-primary text-primary-foreground font-bold shadow-xs shadow-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={`transition-colors ${
                          isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
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
        <div className="p-4 border-t border-sidebar-border">
          <div className="bg-muted/50 rounded-2xl p-3 border border-border flex items-center justify-between gap-3 mb-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-foreground text-background flex items-center justify-center font-bold text-xs shrink-0">
                {userData?.company_name?.charAt(0) || "C"}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {userData?.company_name || userData?.name || "Company"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {userData?.email || "Employer"}
                </p>
              </div>
            </div>

            <button
              onClick={() => logout()}
              title="Sign Out"
              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer shrink-0"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
            <Sparkles size={12} className="text-primary" />
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
              className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative z-10 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border min-h-screen shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="h-18 flex items-center justify-between px-6 border-b border-sidebar-border">
                  <span className="text-lg font-extrabold text-foreground">CareerPilot</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-muted-foreground">
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
                          isActive ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
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
        <header className="h-18 bg-card/85 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted"
            >
              <Menu size={20} />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-extrabold text-muted-foreground uppercase tracking-wider">
                Recruitment Dashboard
              </span>
              <p className="text-sm font-bold text-foreground">
                {userData?.company_name || "Company Workspace"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/dashboard/add-job"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-[0.98]"
            >
              <PlusCircle size={14} />
              <span>Post New Role</span>
            </Link>

            <button
              title="Notifications"
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
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
