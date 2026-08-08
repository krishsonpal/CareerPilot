import { LoaderCircle, Lock, Mail, Upload, UserRound, Phone } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import api from "../utils/api";

const CandidatesSignup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const userSignupHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // The API expects full_name, email, password, phone
      const { data } = await api.post(`/auth/register/student`, {
        full_name: fullName,
        email,
        phone,
        password,
      });

      if (data.id) {
        toast.success("Account created successfully! Please login.");
        navigate("/candidate-login");
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <main className="flex-grow flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-shadow p-8"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Candidate Signup
              </h1>
              <p className="text-sm text-gray-500">
                Welcome! Please sign up to start your journey
              </p>
            </div>

            <form className="space-y-4" onSubmit={userSignupHandler}>
              <div className="border border-gray-200 rounded-xl flex items-center p-3 bg-gray-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <UserRound className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Full Name"
                  className="w-full outline-none text-sm bg-transparent"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="border border-gray-200 rounded-xl flex items-center p-3 bg-gray-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="email"
                  placeholder="Email Address"
                  className="w-full outline-none text-sm bg-transparent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="border border-gray-200 rounded-xl flex items-center p-3 bg-gray-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Phone className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="text"
                  placeholder="Phone Number (Optional)"
                  className="w-full outline-none text-sm bg-transparent"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>

              <div className="border border-gray-200 rounded-xl flex items-center p-3 bg-gray-50/50 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 focus-within:bg-white transition-all">
                <Lock className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="password"
                  placeholder="Password (min 8 characters)"
                  className="w-full outline-none text-sm bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                />
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-600">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                    required
                  />
                  <span>
                    I agree to the{" "}
                    <Link to="/terms" className="text-indigo-600 hover:underline">
                      Terms and Conditions
                    </Link>
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-indigo-600 text-white py-3 px-4 mt-2 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex justify-center items-center font-medium shadow-sm shadow-indigo-200 ${
                  loading ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {loading ? (
                  <LoaderCircle className="animate-spin h-5 w-5" />
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="text-center text-sm text-gray-600 pt-4">
                Already have an account?{" "}
                <Link
                  to="/candidate-login"
                  className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                >
                  Log In
                </Link>
              </div>
            </form>
          </motion.div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CandidatesSignup;
