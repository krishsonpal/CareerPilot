import {
  Briefcase,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Sparkles,
  ArrowRight
} from "lucide-react";
import React, { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { assets } from "../assets/assets";
import { AppContext } from "../context/AppContext";

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);
  
  const { token, userRole, userData, isAuthLoading, logout } = useContext(AppContext);
  const location = useLocation();

  const isStudent = token && userRole === "student";
  const isRecruiter = token && userRole === "recruiter";

  const menu = [
    { name: "Home", path: "/" },
    { name: "All Jobs", path: "/all-jobs/all" },
    { name: "About", path: "/about" },
  ];

  const toggleMenu = () => setIsMobileMenuOpen((prev) => !prev);
  const toggleProfileMenu = () => setIsProfileMenuOpen((prev) => !prev);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target) &&
        !event.target.closest('[aria-label="Toggle menu"]')
      ) {
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsProfileMenuOpen(false);
  }, [location.pathname]);

  return (
    <header className="sticky top-0 z-50 bg-card/85 backdrop-blur-md border-b border-border shadow-xs">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between">
          
          {/* Supabase Styled Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform font-black text-lg">
              CP
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold text-foreground tracking-tight">
                CareerPilot
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden md:flex items-center gap-1.5 bg-muted/60 p-1.5 rounded-xl border border-border">
            {menu.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                      isActive
                        ? "text-primary-foreground bg-primary shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground hover:bg-card/70"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthLoading ? (
              <LoaderCircle className="animate-spin text-primary w-5 h-5" />
            ) : token ? (
              <div className="flex items-center gap-3">
                {/* Direct Workspace Action Link */}
                {isStudent && (
                  <Link
                    to="/app"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    <Briefcase size={14} /> My Workspace
                  </Link>
                )}
                {isRecruiter && (
                  <Link
                    to="/dashboard/manage-jobs"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 transition-colors border border-primary/20"
                  >
                    <LayoutDashboard size={14} /> Recruiter Portal
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-border hover:bg-muted/80 transition-all focus:outline-none cursor-pointer"
                  >
                    <img
                      className="w-8 h-8 rounded-full object-cover bg-muted ring-2 ring-primary/20"
                      src={
                        userData?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userData?.full_name || userData?.company_name || "User"
                        )}&background=10b981&color=fff&bold=true`
                      }
                      alt="Avatar"
                    />
                    <span className="text-sm font-semibold text-foreground max-w-[110px] truncate">
                      {userData?.full_name || userData?.company_name || "Profile"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-muted-foreground transition-transform ${
                        isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-13 w-64 rounded-2xl border border-border bg-card shadow-lg z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-border bg-muted/40">
                          <p className="text-sm font-bold text-foreground truncate">
                            {userData?.full_name || userData?.company_name || "User"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {userData?.email}
                          </p>
                          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                            {userRole}
                          </div>
                        </div>

                        <div className="p-2 space-y-1">
                          {isStudent && (
                            <Link
                              to="/app"
                              className="flex items-center px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors gap-2.5"
                            >
                              <Briefcase size={16} /> Candidate Workspace
                            </Link>
                          )}

                          {isRecruiter && (
                            <Link
                              to="/dashboard/manage-jobs"
                              className="flex items-center px-3 py-2 text-sm font-medium text-foreground hover:bg-muted rounded-xl transition-colors gap-2.5"
                            >
                              <LayoutDashboard size={16} /> Recruiter Dashboard
                            </Link>
                          )}

                          <div className="h-px bg-border my-1"></div>

                          <button
                            onClick={() => logout()}
                            className="w-full text-left flex items-center px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10 rounded-xl transition-colors gap-2.5 cursor-pointer"
                          >
                            <LogOut size={16} /> Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/recruiter-login"
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground px-3.5 py-2 transition-colors rounded-xl hover:bg-muted"
                >
                  Employers
                </Link>
                <Link
                  to="/candidate-login"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 px-5 py-2 rounded-xl text-sm font-bold shadow-xs transition-all active:scale-[0.98]"
                >
                  Sign in
                </Link>
                <Link
                  to="/candidate-signup"
                  className="bg-card hover:bg-muted text-foreground border border-border px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            aria-label="Toggle menu"
            onClick={toggleMenu}
            className="md:hidden p-2 rounded-xl text-foreground hover:bg-muted focus:outline-none cursor-pointer"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-border bg-card px-4 py-5"
          >
            <div className="flex flex-col gap-2" ref={mobileMenuRef}>
              {menu.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground font-bold"
                        : "text-muted-foreground hover:bg-muted"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              <div className="h-px bg-border my-2"></div>

              {token ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-muted rounded-xl">
                    <p className="text-sm font-bold text-foreground">
                      {userData?.full_name || userData?.company_name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">{userData?.email}</p>
                  </div>
                  {isStudent && (
                    <Link
                      to="/app"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Briefcase size={16} /> Candidate Workspace
                    </Link>
                  )}
                  {isRecruiter && (
                    <Link
                      to="/dashboard/manage-jobs"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-foreground hover:bg-muted"
                    >
                      <LayoutDashboard size={16} /> Recruiter Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to="/candidate-login"
                    className="w-full text-center bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-bold shadow-xs"
                  >
                    Candidate Sign In
                  </Link>
                  <Link
                    to="/recruiter-login"
                    className="w-full text-center bg-muted text-foreground py-2.5 rounded-xl text-sm font-semibold hover:bg-muted/80"
                  >
                    Employer Sign In
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
