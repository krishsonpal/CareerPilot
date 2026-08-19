import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loader from "./Loader";

const ProtectedRoute = ({ children, role = "student" }) => {
  const { token, userRole, isAuthLoading } = useContext(AppContext);
  const location = useLocation();

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader />
      </div>
    );
  }

  if (!token) {
    const loginPath = role === "recruiter" ? "/recruiter-login" : "/candidate-login";
    return <Navigate to={`${loginPath}?next=${encodeURIComponent(location.pathname)}`} replace />;
  }

  // If role does not match, route to appropriate portal
  if (role && userRole !== role) {
    if (userRole === "recruiter") {
      return <Navigate to="/dashboard/manage-jobs" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return children;
};

export default ProtectedRoute;
