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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100/90 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.04)]">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-18 flex items-center justify-between">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl flex items-center justify-center shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg tracking-tight">CP</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-800 tracking-tight">
                CareerPilot
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <ul className="hidden md:flex items-center gap-1.5 bg-slate-50/80 p-1.5 rounded-2xl border border-slate-200/60">
            {menu.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "text-indigo-600 bg-white shadow-sm font-bold"
                        : "text-slate-600 hover:text-indigo-600 hover:bg-white/60"
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
              <LoaderCircle className="animate-spin text-indigo-600 w-5 h-5" />
            ) : token ? (
              <div className="flex items-center gap-3">
                {/* Direct Workspace Action Link */}
                {isStudent && (
                  <Link
                    to="/applications"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    <Briefcase size={14} /> My Workspace
                  </Link>
                )}
                {isRecruiter && (
                  <Link
                    to="/dashboard/manage-jobs"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-100"
                  >
                    <LayoutDashboard size={14} /> Recruiter Portal
                  </Link>
                )}

                {/* User Dropdown */}
                <div className="relative" ref={profileMenuRef}>
                  <button
                    onClick={toggleProfileMenu}
                    className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full border border-slate-200 hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none cursor-pointer"
                  >
                    <img
                      className="w-8 h-8 rounded-full object-cover bg-slate-100 ring-2 ring-indigo-500/20"
                      src={
                        userData?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(
                          userData?.full_name || userData?.company_name || "User"
                        )}&background=6366f1&color=fff&bold=true`
                      }
                      alt="Avatar"
                    />
                    <span className="text-sm font-semibold text-slate-700 max-w-[110px] truncate">
                      {userData?.full_name || userData?.company_name || "Profile"}
                    </span>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${
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
                        className="absolute right-0 top-13 w-64 rounded-2xl border border-slate-100 bg-white shadow-xl z-50 overflow-hidden"
                      >
                        <div className="p-4 border-b border-slate-100 bg-slate-50/70">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {userData?.full_name || userData?.company_name || "User"}
                          </p>
                          <p className="text-xs text-slate-500 truncate mt-0.5">
                            {userData?.email}
                          </p>
                          <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                            {userRole}
                          </div>
                        </div>

                        <div className="p-2 space-y-1">
                          {isStudent && (
                            <Link
                              to="/applications"
                              className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors gap-2.5"
                            >
                              <Briefcase size={16} /> My Applications
                            </Link>
                          )}

                          {isRecruiter && (
                            <Link
                              to="/dashboard/manage-jobs"
                              className="flex items-center px-3 py-2 text-sm font-medium text-slate-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors gap-2.5"
                            >
                              <LayoutDashboard size={16} /> Recruiter Dashboard
                            </Link>
                          )}

                          <div className="h-px bg-slate-100 my-1"></div>

                          <button
                            onClick={() => logout()}
                            className="w-full text-left flex items-center px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-xl transition-colors gap-2.5 cursor-pointer"
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
                  className="text-sm font-semibold text-slate-600 hover:text-indigo-600 px-3.5 py-2 transition-colors rounded-xl hover:bg-slate-50"
                >
                  Employers
                </Link>
                <Link
                  to="/candidate-login"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200 transition-all hover:shadow-md hover:shadow-indigo-200 active:scale-[0.98]"
                >
                  Sign in
                </Link>
                <Link
                  to="/candidate-signup"
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-sm font-semibold transition-all active:scale-[0.98]"
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
            className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none cursor-pointer"
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
            className="md:hidden border-b border-slate-200 bg-white/95 backdrop-blur-xl px-4 py-5"
          >
            <div className="flex flex-col gap-2" ref={mobileMenuRef}>
              {menu.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-700 font-bold"
                        : "text-slate-600 hover:bg-slate-50"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              ))}

              <div className="h-px bg-slate-100 my-2"></div>

              {token ? (
                <div className="space-y-2">
                  <div className="px-4 py-2 bg-slate-50 rounded-xl">
                    <p className="text-sm font-bold text-slate-900">
                      {userData?.full_name || userData?.company_name || "User"}
                    </p>
                    <p className="text-xs text-slate-500">{userData?.email}</p>
                  </div>
                  {isStudent && (
                    <Link
                      to="/applications"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50"
                    >
                      <Briefcase size={16} /> My Applications
                    </Link>
                  )}
                  {isRecruiter && (
                    <Link
                      to="/dashboard/manage-jobs"
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-700 hover:bg-indigo-50"
                    >
                      <LayoutDashboard size={16} /> Recruiter Dashboard
                    </Link>
                  )}
                  <button
                    onClick={() => logout()}
                    className="w-full text-left flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50"
                  >
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2 pt-1">
                  <Link
                    to="/candidate-login"
                    className="w-full text-center bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-indigo-200"
                  >
                    Candidate Sign In
                  </Link>
                  <Link
                    to="/recruiter-login"
                    className="w-full text-center bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-200"
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
