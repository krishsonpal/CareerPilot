import { LoaderCircle, Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";

const CandidatesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");

  const { setToken, setUserRole, getRedirectPath } = useContext(AppContext);

  const userLoginHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post(`/auth/login/student`, {
        email,
        password,
      });

      if (data.access_token) {
        setToken(data.access_token);
        setUserRole(data.role); // "student"
        
        toast.success("Welcome back! Login successful.");
        const redirectUrl = getRedirectPath("student", nextParam);
        setTimeout(() => {
          navigate(redirectUrl);
        }, 100);
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    if (role === "recruiter") {
      navigate(nextParam ? `/recruiter-login?next=${encodeURIComponent(nextParam)}` : "/recruiter-login");
    }
  };

  return (
    <AuthLayout
      title="Candidate Sign In"
      subtitle="Welcome back! Sign in to access your AI Career Coach and smart job matches."
      activeRole="candidate"
      onRoleChange={handleRoleChange}
    >
      <form className="space-y-4.5" onSubmit={userLoginHandler}>
        
        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-3 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
            <Mail className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="email"
              placeholder="alex@example.com"
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
            <span className="text-xs font-medium text-slate-600">Keep me signed in</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg hover:shadow-indigo-200 active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer ${
            loading ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          {loading ? (
            <LoaderCircle className="animate-spin h-5 w-5" />
          ) : (
            <>
              <span>Sign In to CareerPilot</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-slate-600 pt-3">
          Don't have an account?{" "}
          <Link
            to={nextParam ? `/candidate-signup?next=${encodeURIComponent(nextParam)}` : "/candidate-signup"}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default CandidatesLogin;
