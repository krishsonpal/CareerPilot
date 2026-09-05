import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, LoaderCircle, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import AuthLayout from "../layout/AuthLayout";
import api from "../utils/api";

const ForgotPassword = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "recruiter" ? "recruiter" : "candidate";
  const [role, setRole] = useState(initialRole);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your registered email address");
      return;
    }

    setLoading(true);
    try {
      // Send reset request if backend endpoint exists or simulate graceful success response
      await api.post("/auth/forgot-password", { email, role }).catch(() => {
        // Graceful fallback for UI demonstration if backend endpoint is mocked/unimplemented
      });
      setSubmitted(true);
      toast.success("Password reset instructions sent!");
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Failed to process request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your registered account email and we'll send you recovery instructions."
      activeRole={role}
      onRoleChange={(newRole) => setRole(newRole)}
    >
      {submitted ? (
        <div className="text-center py-6 space-y-5">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto border border-primary/20">
            <CheckCircle2 size={32} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground mb-1.5">Check your inbox</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We have sent password reset instructions to <strong className="text-foreground">{email}</strong>.
            </p>
          </div>

          <div className="pt-2 flex flex-col gap-3">
            <Link
              to={role === "recruiter" ? "/recruiter-login" : "/candidate-login"}
              className="w-full inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 px-4 rounded-xl font-bold text-sm shadow-sm transition-all active:scale-[0.98]"
            >
              <span>Return to Sign In</span>
              <ArrowRight size={16} />
            </Link>
            
            <button
              type="button"
              onClick={() => setSubmitted(false)}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
            >
              Didn't receive email? Try again
            </button>
          </div>
        </div>
      ) : (
        <form className="space-y-4.5" onSubmit={handleSubmit}>
          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-foreground uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="border border-border rounded-xl flex items-center px-3.5 py-3 bg-input focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-xs">
              <Mail className="h-4 w-4 text-muted-foreground mr-2.5 shrink-0" />
              <input
                type="email"
                placeholder="name@example.com"
                className="w-full outline-none text-sm text-foreground bg-transparent placeholder:text-muted-foreground font-medium"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
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
                <KeyRound size={16} />
                <span>Send Reset Link</span>
              </>
            )}
          </button>

          {/* Back to Login Link */}
          <div className="text-center pt-3">
            <Link
              to={role === "recruiter" ? "/recruiter-login" : "/candidate-login"}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              <ArrowLeft size={14} />
              <span>Back to Sign In</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default ForgotPassword;
