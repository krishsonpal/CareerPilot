import {
  Briefcase,
  ChevronDown,
  LoaderCircle,
  LogOut,
  Menu,
  X,
  LayoutDashboard
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
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <nav className="container mx-auto px-4 md:px-8">
        <div className="h-20 flex items-center justify-between">
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-sm shadow-indigo-200">
              <span className="text-white font-bold text-xl leading-none">CP</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-700">CareerPilot</span>
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden lg:flex items-center gap-2">
            {menu.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? "text-indigo-600 bg-indigo-50/80 shadow-sm"
                        : "text-gray-600 hover:text-indigo-600 hover:bg-gray-50"
                    }`
                  }
                >
                  {item.name}
                </NavLink>
              </li>
            ))}
          </ul>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4">
            {isAuthLoading ? (
              <LoaderCircle className="animate-spin text-indigo-600 w-5 h-5" />
            ) : token ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={toggleProfileMenu}
                  className="flex items-center gap-3 p-1.5 pr-3 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all focus:outline-none"
                >
                  <img
                    className="w-8 h-8 rounded-full object-cover bg-gray-100"
                    src={userData?.avatar_url || assets.avatarPlaceholder || "https://ui-avatars.com/api/?name="+encodeURIComponent(userData?.full_name || userData?.company_name || 'U')+"&background=4f46e5&color=fff"}
                    alt="User"
                  />
                  <span className="text-sm font-semibold text-gray-700 max-w-[120px] truncate">
                    {userData?.full_name || userData?.company_name || "Profile"}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`text-gray-400 transition-transform ${isProfileMenuOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {isProfileMenuOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-14 w-64 rounded-2xl border border-gray-100 bg-white shadow-xl z-50 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                        <p className="text-sm font-bold text-gray-900 truncate">
                          {userData?.full_name || userData?.company_name || "User"}
                        </p>
                        <p className="text-xs text-gray-500 truncate mt-0.5">{userData?.email}</p>
                        <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-100 text-indigo-700">
                          {userRole}
                        </div>
                      </div>
                      
                      <div className="p-2">
                        {isStudent && (
                          <Link to="/applications" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors gap-3">
                            <Briefcase size={16} /> My Applications
                          </Link>
                        )}
                        
                        {isRecruiter && (
                          <Link to="/dashboard/manage-jobs" className="flex items-center px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 rounded-xl transition-colors gap-3">
                            <LayoutDashboard size={16} /> Recruiter Dashboard
                          </Link>
                        )}
                        
                        <div className="h-px bg-gray-100 my-1 mx-2"></div>
                        
                        <button
                          onClick={() => logout()}
                          className="w-full text-left flex items-center px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-colors gap-3"
                        >
                          <LogOut size={16} /> Sign Out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/recruiter-login"
                  className="text-sm font-semibold text-gray-600 hover:text-indigo-600 px-3 py-2 transition-colors"
                >
                  Employers
                </Link>
                <Link
                  to="/candidate-login"
                  className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm hover:bg-indigo-700 shadow-sm shadow-indigo-200 transition-all font-semibold active:scale-[0.98]"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            aria-label="Toggle menu"
            onClick={toggleMenu}
            className="lg:hidden p-2 rounded-xl text-gray-600 hover:bg-gray-50 focus:outline-none"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm"
          >
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="absolute left-0 top-0 bottom-0 w-4/5 max-w-sm bg-white border-r border-gray-100 shadow-2xl flex flex-col"
              ref={mobileMenuRef}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">CP</span>
                  </div>
                  <span className="text-lg font-bold text-gray-900">CareerPilot</span>
                </div>
                <button onClick={toggleMenu} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
                {menu.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={toggleMenu}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        isActive ? "bg-indigo-50 text-indigo-600" : "text-gray-700 hover:bg-gray-50"
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                ))}
              </div>

              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                {isAuthLoading ? (
                  <div className="flex justify-center"><LoaderCircle className="animate-spin text-indigo-600" /></div>
                ) : token ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <img
                        className="w-10 h-10 rounded-full object-cover bg-gray-200"
                        src={userData?.avatar_url || "https://ui-avatars.com/api/?name="+encodeURIComponent(userData?.full_name || userData?.company_name || 'U')+"&background=4f46e5&color=fff"}
                        alt="User"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{userData?.full_name || userData?.company_name || "User"}</p>
                        <p className="text-xs text-gray-500 truncate">{userData?.email}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-1.5 pt-2">
                      {isStudent && (
                        <Link to="/applications" onClick={toggleMenu} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          <Briefcase size={18} /> My Applications
                        </Link>
                      )}
                      
                      {isRecruiter && (
                        <Link to="/dashboard/manage-jobs" onClick={toggleMenu} className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                          <LayoutDashboard size={18} /> Dashboard
                        </Link>
                      )}
                      
                      <button onClick={() => { toggleMenu(); logout(); }} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut size={18} /> Sign Out
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <Link to="/candidate-login" onClick={toggleMenu} className="w-full text-center bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-sm hover:bg-indigo-700">
                      Sign In
                    </Link>
                    <Link to="/recruiter-login" onClick={toggleMenu} className="w-full text-center bg-white border border-gray-200 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50">
                      Employer Sign In
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;
