import { LoaderCircle, Lock, Mail, Eye, EyeOff, ArrowRight, Building2 } from "lucide-react";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";

const RecruiterLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");

  const { setToken, setUserRole, getRedirectPath } = useContext(AppContext);

  const recruiterLoginHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/login/recruiter`, {
        email,
        password,
      });

      if (data.access_token) {
        setToken(data.access_token);
        setUserRole(data.role); // "recruiter"
        
        toast.success("Welcome back! Recruiter portal unlocked.");
        const redirectUrl = getRedirectPath("recruiter", nextParam);
        setTimeout(() => {
          navigate(redirectUrl);
        }, 100);
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Invalid company email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    if (role === "candidate") {
      navigate(nextParam ? `/candidate-login?next=${encodeURIComponent(nextParam)}` : "/candidate-login");
    }
  };

  return (
    <AuthLayout
      title="Employer Sign In"
      subtitle="Access your company hiring dashboard, review AI-ranked candidates, and manage postings."
      activeRole="recruiter"
      onRoleChange={handleRoleChange}
    >
      <form className="space-y-4.5" onSubmit={recruiterLoginHandler}>
        
        {/* Company Email */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Work Email Address
          </label>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-3 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
            <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="email"
              placeholder="recruiter@company.com"
              className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password
            </label>
            <a href="#" className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-3 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
            <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Remember me Checkbox */}
        <div className="flex items-center">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
            <span className="text-xs font-medium text-slate-600">Remember company login</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 hover:from-slate-800 hover:to-indigo-900 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md shadow-slate-900/20 hover:shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer ${
            loading ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          {loading ? (
            <LoaderCircle className="animate-spin h-5 w-5" />
          ) : (
            <>
              <span>Sign In to Employer Portal</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-slate-600 pt-3">
          New hiring partner?{" "}
          <Link
            to={nextParam ? `/recruiter-signup?next=${encodeURIComponent(nextParam)}` : "/recruiter-signup"}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
          >
            Register company
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RecruiterLogin;
