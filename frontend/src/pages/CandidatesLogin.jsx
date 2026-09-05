import { LoaderCircle, Lock, Mail, Eye, EyeOff, ArrowRight } from "lucide-react";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";

const CandidatesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
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
        setUserRole(data.role);
        
        toast.success("Welcome back! Login successful.");
        const redirectUrl = getRedirectPath("student", nextParam);
        setTimeout(() => {
          navigate(redirectUrl, { state: location.state });
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
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Mail className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type="email"
              placeholder="alex@example.com"
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
            <Link to="/forgot-password?role=candidate" className="text-xs font-bold text-primary hover:text-primary/80 hover:underline">
              Forgot password?
            </Link>
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
            <span className="text-xs font-medium text-muted-foreground">Keep me signed in</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer ${
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
        <div className="text-center text-sm text-muted-foreground pt-3">
          Don't have an account?{" "}
          <Link
            to={nextParam ? `/candidate-signup?next=${encodeURIComponent(nextParam)}` : "/candidate-signup"}
            className="text-primary hover:text-primary/80 font-bold hover:underline"
          >
            Sign up
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default CandidatesLogin;
