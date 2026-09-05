import React, { useContext } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Bot,
  Briefcase,
  FileCheck,
  UserCheck,
  LogOut,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { AppContext } from "../context/AppContext";

const AppSidebar = () => {
  const { userData, logout } = useContext(AppContext);

  const navLinks = [
    {
      name: "Overview",
      path: "/app",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: "AI Assistant",
      path: "/app/assistant",
      icon: Bot,
      badge: "Streaming",
    },
    {
      name: "Find Jobs",
      path: "/app/jobs",
      icon: Briefcase,
      badge: null,
    },
    {
      name: "Applications",
      path: "/app/applications",
      icon: FileCheck,
      badge: null,
    },
    {
      name: "Resume Profile",
      path: "/app/profile",
      icon: UserCheck,
      badge: "BullMQ",
    },
  ];

  return (
    <aside className="w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border flex flex-col justify-between shrink-0 min-h-screen sticky top-0 z-30">
      
      {/* Top Branding & Main Navigation */}
      <div>
        {/* Brand Header */}
        <div className="h-18 flex items-center px-6 border-b border-sidebar-border">
          <Link to="/app" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-xl flex items-center justify-center font-black text-base shadow-xs group-hover:scale-105 transition-transform">
              CP
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold text-foreground tracking-tight leading-tight">
                CareerPilot
              </span>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">
                Candidate App
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === "/app"}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all group ${
                    isActive
                      ? "bg-primary text-primary-foreground font-bold shadow-xs shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
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
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-primary/10 text-primary border border-primary/20"
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

      {/* Bottom Profile Summary & Logout */}
      <div className="p-4 border-t border-sidebar-border">
        {/* User Card */}
        <div className="bg-muted/50 rounded-2xl p-3 border border-border flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <img
              src={
                userData?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(
                  userData?.full_name || "Student"
                )}&background=10b981&color=fff&bold=true`
              }
              alt="Profile"
              className="w-9 h-9 rounded-xl object-cover ring-2 ring-primary/20 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">
                {userData?.full_name || "Candidate User"}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {userData?.email || "Student Account"}
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

        {/* Vector Status Pill */}
        <div className="text-[11px] text-muted-foreground text-center flex items-center justify-center gap-1">
          <Sparkles size={12} className="text-primary" />
          <span>FAISS Engine Connected</span>
        </div>
      </div>

    </aside>
  );
};

export default AppSidebar;
