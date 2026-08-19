import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, Sparkles, Menu, X } from "lucide-react";
import { AppContext } from "../context/AppContext";

const AppTopbar = ({ onToggleMobileMenu }) => {
  const { userData, setSearchFilter, setIsSearched } = useContext(AppContext);
  const [searchValue, setSearchValue] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchFilter((prev) => ({ ...prev, title: searchValue.trim() }));
      setIsSearched(true);
      navigate("/app/jobs");
    }
  };

  return (
    <header className="h-18 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      
      {/* Left: Mobile Menu Toggle & Global Search Pill */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
          aria-label="Toggle Menu"
        >
          <Menu size={20} />
        </button>

        {/* Global Search Pill Bar (from Screen 3) */}
        <form onSubmit={handleSearch} className="w-full relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search by role, skills, or query (e.g. Remote Python FAISS)..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200/80 focus:border-indigo-500 rounded-full pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-900 outline-none transition-all placeholder-slate-400 font-medium"
          />
        </form>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 ml-4">
        
        {/* Quick AI Help Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-100">
          <Sparkles size={13} className="text-indigo-600" />
          <span>FAISS Engine Online</span>
        </div>

        {/* Notifications Bell */}
        <button
          title="Notifications"
          className="relative p-2 rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full ring-2 ring-white" />
        </button>

        <div className="h-6 w-px bg-slate-200 hidden sm:block" />

        {/* User Pill */}
        <div className="flex items-center gap-2.5">
          <img
            src={
              userData?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userData?.full_name || "Alex"
              )}&background=6366f1&color=fff&bold=true`
            }
            alt="User Avatar"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-indigo-500/20"
          />
          <span className="hidden sm:block text-xs font-bold text-slate-800 max-w-[120px] truncate">
            {userData?.full_name?.split(" ")[0] || "Alex"}
          </span>
        </div>

      </div>

    </header>
  );
};

export default AppTopbar;
