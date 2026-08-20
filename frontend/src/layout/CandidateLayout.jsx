import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";
import AppTopbar from "../components/AppTopbar";
import { AnimatePresence, motion } from "framer-motion";
import { X, LayoutDashboard, Bot, Briefcase, FileCheck, UserCheck } from "lucide-react";
import { NavLink } from "react-router-dom";

const CandidateLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const mobileNavLinks = [
    { name: "Overview", path: "/app", icon: LayoutDashboard },
    { name: "AI Assistant", path: "/app/assistant", icon: Bot },
    { name: "Find Jobs", path: "/app/jobs", icon: Briefcase },
    { name: "Applications", path: "/app/applications", icon: FileCheck },
    { name: "Resume Profile", path: "/app/profile", icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-row">
      
      {/* 1. Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0">
        <AppSidebar />
      </div>

      {/* 2. Mobile Drawer Navigation */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-xs"
            />

            {/* Drawer */}
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
                  <button
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
                  >
                    <X size={20} />
                  </button>
                </div>

                <nav className="p-4 space-y-1.5">
                  {mobileNavLinks.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === "/app"}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-primary text-primary-foreground font-bold shadow-xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
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

      {/* 3. Main Content Container with Topbar */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <AppTopbar onToggleMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

    </div>
  );
};

export default CandidateLayout;
