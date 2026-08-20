import { LoaderCircle, Lock, Mail, Building2, Globe, Eye, EyeOff, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import api from "../utils/api";

const RecruiterSignup = () => {
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");

  const recruiterSignupHandler = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please accept the terms and conditions");
      return;
    }
    setLoading(true);

    try {
      const { data } = await api.post(`/auth/register/recruiter`, {
        company_name: companyName,
        email,
        website,
        password,
      });

      if (data.id) {
        toast.success("Company registered successfully! Please sign in.");
        navigate(nextParam ? `/recruiter-login?next=${encodeURIComponent(nextParam)}` : "/recruiter-login");
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    if (role === "candidate") {
      navigate(nextParam ? `/candidate-signup?next=${encodeURIComponent(nextParam)}` : "/candidate-signup");
    }
  };

  return (
    <AuthLayout
      title="Register Employer Account"
      subtitle="Join CareerPilot to publish postings, search talent, and review AI-ranked applicants."
      activeRole="recruiter"
      onRoleChange={handleRoleChange}
    >
      <form className="space-y-4" onSubmit={recruiterSignupHandler}>
        
        {/* Company Name */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Company Name
          </label>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-2.5 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Building2 className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Acme Technologies Inc."
              className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Company Email */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Work Email Address
          </label>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-2.5 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Mail className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type="email"
              placeholder="recruiter@acme.com"
              className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
        </div>

        {/* Website (Optional) */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Website URL <span className="text-muted-foreground font-normal">(Optional)</span>
          </label>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-2.5 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Globe className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type="url"
              placeholder="https://acme.com"
              className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1">
            Password (min 8 characters)
          </label>
          <div className="border border-border rounded-xl flex items-center px-3.5 py-2.5 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
            <Lock className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
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

        {/* Terms */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 accent-primary rounded border-border mt-0.5 cursor-pointer"
              required
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="text-primary font-bold hover:underline">
                Employer Terms
              </Link>{" "}
              and{" "}
              <Link to="/terms" className="text-primary font-bold hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-foreground hover:bg-foreground/90 text-background py-3 px-4 rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer mt-2 ${
            loading ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          {loading ? (
            <LoaderCircle className="animate-spin h-5 w-5" />
          ) : (
            <>
              <span>Register Employer Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Login Link */}
        <div className="text-center text-sm text-muted-foreground pt-2">
          Already registered?{" "}
          <Link
            to={nextParam ? `/recruiter-login?next=${encodeURIComponent(nextParam)}` : "/recruiter-login"}
            className="text-primary hover:text-primary/80 font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default RecruiterSignup;
