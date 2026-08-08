import { LoaderCircle, Lock, Mail } from "lucide-react";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";
import api from "../utils/api";

const CandidatesLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { setToken, setUserRole } = useContext(AppContext);

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
        
        toast.success("Login successful!");
        setTimeout(() => {
          navigate("/");
        }, 100);
      }
    } catch (error) {
      toast.error(error?.response?.data?.detail || "Invalid credentials");
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
                Candidate Login
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back! Please login to continue
              </p>
            </div>

            <form className="space-y-5" onSubmit={userLoginHandler}>
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
                <Lock className="h-5 w-5 text-gray-400 mr-3" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full outline-none text-sm bg-transparent"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <a href="#" className="text-sm text-indigo-600 hover:text-indigo-700 hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-indigo-600 text-white py-3 px-4 rounded-xl hover:bg-indigo-700 active:scale-[0.98] transition-all flex justify-center items-center font-medium shadow-sm shadow-indigo-200 ${
                  loading ? "cursor-not-allowed opacity-70" : ""
                }`}
              >
                {loading ? (
                  <LoaderCircle className="animate-spin h-5 w-5" />
                ) : (
                  "Log In"
                )}
              </button>

              <div className="text-center text-sm text-gray-600 mt-6">
                Don't have an account?{" "}
                <Link
                  to="/candidate-signup"
                  className="text-indigo-600 hover:text-indigo-800 font-medium hover:underline"
                >
                  Sign Up
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

export default CandidatesLogin;
