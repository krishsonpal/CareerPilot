import React, { useContext, useState } from "react";
import { Search, Bell, Sparkles, Menu } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";

const AppTopbar = ({ onToggleMobileMenu }) => {
  const { userData, setSearchFilter, setIsSearched } = useContext(AppContext);
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  const handleGlobalSearch = (e) => {
    e.preventDefault();
    if (!searchInput.trim()) return;

    setSearchFilter({
      title: searchInput.trim(),
      location: "",
    });
    setIsSearched(true);
    navigate("/app/jobs");
  };

  return (
    <header className="h-18 bg-card/85 backdrop-blur-md border-b border-border px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20">
      
      {/* Left: Mobile Menu Toggle & Search Pill Bar */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-foreground hover:bg-muted focus:outline-none cursor-pointer"
          aria-label="Open Navigation"
        >
          <Menu size={20} />
        </button>

        <form
          onSubmit={handleGlobalSearch}
          className="w-full relative flex items-center"
        >
          <Search
            size={16}
            className="absolute left-3.5 text-muted-foreground pointer-events-none"
          />
          <input
            type="text"
            placeholder="Search AI jobs, tech skills, companies..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-input/70 border border-border rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:bg-card transition-all font-medium"
          />
        </form>
      </div>

      {/* Right: Status Pill & Avatar */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0 pl-3">
        
        {/* Real-time Match Engine Status Pill */}
        <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-bold text-foreground">
          <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <span>Semantic Match Ready</span>
        </div>

        {/* Notifications Icon */}
        <button
          title="Notifications"
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <Bell size={18} />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2">
          <img
            src={
              userData?.avatar_url ||
              `https://ui-avatars.com/api/?name=${encodeURIComponent(
                userData?.full_name || "User"
              )}&background=10b981&color=fff&bold=true`
            }
            alt="Avatar"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/20"
          />
        </div>

      </div>

    </header>
  );
};

export default AppTopbar;
