import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Sparkles,
  Search,
  FileCheck,
  UserCheck,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Compass
} from "lucide-react";
import { AppContext } from "../context/AppContext";

const AppSidebar = () => {
  const { userData, userRole, logout } = useContext(AppContext);

  const navItems = [
    {
      name: "Overview",
      path: "/app",
      icon: LayoutDashboard,
      end: true,
    },
    {
      name: "AI Assistant",
      path: "/app/assistant",
      icon: Sparkles,
      badge: "Live",
    },
    {
      name: "Find Jobs",
      path: "/app/jobs",
      icon: Search,
    },
    {
      name: "My Applications",
      path: "/app/applications",
      icon: FileCheck,
    },
    {
      name: "Profile & Resume",
      path: "/app/profile",
      icon: UserCheck,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
      
      {/* Top Brand Area */}
      <div>
        <div className="h-18 flex items-center px-6 border-b border-slate-100">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-base">CP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
                CareerPilot
              </span>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">
                Candidate Workspace
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Menu */}
        <nav className="p-4 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200/60 font-bold"
                      : "text-slate-600 hover:text-indigo-600 hover:bg-slate-50"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon
                        size={18}
                        className={`transition-colors ${
                          isActive
                            ? "text-white"
                            : "text-slate-400 group-hover:text-indigo-600"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Bottom User Profile Card & Logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-slate-50 rounded-2xl p-3 border border-slate-200/60 flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                userData?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userData?.full_name || "Student"
                )}&background=6366f1&color=fff&bold=true`
              }
              alt="Avatar"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {userData?.full_name || "Candidate"}
              </p>
              <p className="text-[11px] text-slate-400 truncate">
                {userData?.email || "Student Account"}
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
          <ShieldCheck size={12} className="text-emerald-500" />
          <span>AI Matching Active</span>
        </div>
      </div>

    </aside>
  );
};

export default AppSidebar;
