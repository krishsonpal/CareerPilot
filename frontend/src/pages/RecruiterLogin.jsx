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
        setUserRole(data.role);
        
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
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            Work Email Address
          </label>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Mail className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type="email"
              placeholder="recruiter@company.com"
              className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
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
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider">
              Password
            </label>
            <a href="#" className="text-xs font-bold text-primary hover:text-primary/80 hover:underline">
              Forgot password?
            </a>
          </div>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Lock className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground focus:outline-none cursor-pointer"
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
              className="h-4 w-4 accent-primary rounded border-border cursor-pointer"
            />
            <span className="text-xs font-medium text-muted-foreground">Remember company login</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-foreground hover:bg-foreground/90 text-background py-3 px-4 rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer ${
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
        <div className="text-center text-sm text-muted-foreground pt-3">
          New hiring partner?{" "}
          <Link
            to={nextParam ? `/recruiter-signup?next=${encodeURIComponent(nextParam)}` : "/recruiter-signup"}
            className="text-primary hover:text-primary/80 font-bold hover:underline"
          >
            Register company
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RecruiterLogin;
