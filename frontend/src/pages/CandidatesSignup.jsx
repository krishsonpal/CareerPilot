import { LoaderCircle, Lock, Mail, UserRound, Phone, Eye, EyeOff, ArrowRight } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthLayout from "../layout/AuthLayout";
import api from "../utils/api";

const CandidatesSignup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const nextParam = searchParams.get("next");

  const userSignupHandler = async (e) => {
    e.preventDefault();
    if (!agreed) {
      toast.error("Please accept the terms and privacy policy");
      return;
    }
    setLoading(true);

    try {
      const { data } = await api.post(`/auth/register/student`, {
        full_name: fullName,
        email,
        phone,
        password,
      });

      if (data.id) {
        toast.success("Account created successfully! Please sign in.");
        navigate(nextParam ? `/candidate-login?next=${encodeURIComponent(nextParam)}` : "/candidate-login");
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = (role) => {
    if (role === "recruiter") {
      navigate(nextParam ? `/recruiter-signup?next=${encodeURIComponent(nextParam)}` : "/recruiter-signup");
    }
  };

  return (
    <AuthLayout
      title="Create Candidate Account"
      subtitle="Join CareerPilot to get semantic job matching and live career guidance."
      activeRole="candidate"
      onRoleChange={handleRoleChange}
    >
      <form className="space-y-4" onSubmit={userSignupHandler}>
        
        {/* Full Name */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Full Name
          </label>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-2.5 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
            <UserRound className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="Alex Johnson"
              className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
        </div>

        {/* Email Address */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-2.5 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
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

        {/* Phone (Optional) */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Phone Number <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-2.5 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
            <Phone className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type="text"
              placeholder="+1 (555) 000-0000"
              className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
            Password (min 8 characters)
          </label>
          <div className="border border-slate-200 rounded-xl flex items-center px-3.5 py-2.5 bg-slate-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all shadow-xs">
            <Lock className="h-4 w-4 text-slate-400 mr-2.5 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              className="w-full outline-none text-sm text-slate-900 bg-transparent placeholder-slate-400 font-medium"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={8}
              required
              autoComplete="new-password"
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

        {/* Terms agreement */}
        <div className="pt-1">
          <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-600">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="h-4 w-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5 cursor-pointer"
              required
            />
            <span>
              I agree to the{" "}
              <Link to="/terms" className="text-indigo-600 font-bold hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/terms" className="text-indigo-600 font-bold hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className={`w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md shadow-indigo-200 hover:shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 cursor-pointer mt-2 ${
            loading ? "cursor-not-allowed opacity-70" : ""
          }`}
        >
          {loading ? (
            <LoaderCircle className="animate-spin h-5 w-5" />
          ) : (
            <>
              <span>Create Candidate Account</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        {/* Login Link */}
        <div className="text-center text-sm text-slate-600 pt-2">
          Already have an account?{" "}
          <Link
            to={nextParam ? `/candidate-login?next=${encodeURIComponent(nextParam)}` : "/candidate-login"}
            className="text-indigo-600 hover:text-indigo-800 font-bold hover:underline"
          >
            Sign in
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default CandidatesSignup;
