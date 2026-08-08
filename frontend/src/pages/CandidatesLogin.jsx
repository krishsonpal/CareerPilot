import axios from "axios";
import { LoaderCircle, Lock, Mail } from "lucide-react";
import React, { useContext, useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom"; // ✅ Added useNavigate
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { AppContext } from "../context/AppContext";

const CandidatesLogin = () => {
  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const { backendUrl, setUserData, setUserToken, setIsLogin } =
    useContext(AppContext);

  const userLoginHandler = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await axios.post(`${backendUrl}/student/login`, {
        student_id: studentId,
        password,
      });

      console.log("Login response:", data); // Debug log

      if (data.access_token) {
        // Store token and user data
        localStorage.setItem("userToken", data.access_token);
        localStorage.setItem("userData", JSON.stringify({
          student_id: data.user_id,
          user_type: data.user_type
        }));
        
        // Update context
        setUserToken(data.access_token);
        setUserData({
          student_id: data.user_id,
          user_type: data.user_type
        });
        setIsLogin(true);
        
        console.log("Login successful, navigating to home...");
        toast.success("Login successful!");
        
        // Small delay to ensure state is updated
        setTimeout(() => {
          navigate("/");
        }, 100);
      } else {
        toast.error("Login failed - no access token received");
      }
    } catch (error) {
      console.error("Login error:", error); // Debug log
      toast.error(error?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="flex flex-col">
        <main className="flex-grow flex items-center justify-center">
          <div className="w-full max-w-md border border-gray-200 rounded-lg p-6 bg-white">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-semibold text-gray-700 mb-1">
                Candidate Login
              </h1>
              <p className="text-sm text-gray-600">
                Welcome back! Please login to continue
              </p>
            </div>

            <form className="space-y-4" onSubmit={userLoginHandler}>
              <div className="border border-gray-300 rounded flex items-center p-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <Mail className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="text"
                  placeholder="Student ID"
                  className="w-full outline-none text-sm"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  required
                />
              </div>

              <div className="border border-gray-300 rounded flex items-center p-2.5 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
                <Lock className="h-5 w-5 text-gray-400 mr-2" />
                <input
                  type="password"
                  placeholder="Password"
                  className="w-full outline-none text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                    required
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition flex justify-center items-center cursor-pointer ${
                  loading ? "cursor-not-allowed opacity-50" : ""
                }`}
              >
                {loading ? (
                  <LoaderCircle className="animate-spin h-5 w-5" />
                ) : (
                  "Login"
                )}
              </button>

              <div className="text-center text-sm text-gray-600 mt-2">
                Don't have an account?{" "}
                <Link
                  to="/candidate-signup"
                  className="text-blue-600 hover:text-blue-800 font-medium hover:underline"
                >
                  Sign Up
                </Link>
              </div>
            </form>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default CandidatesLogin;
