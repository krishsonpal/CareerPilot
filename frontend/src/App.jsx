import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import CandidateLayout from "./layout/CandidateLayout";
import ProtectedRoute from "./components/ProtectedRoute";

// Public Pages
import Home from "./pages/Home";
import AllJobs from "./pages/AllJobs";
import About from "./pages/About";
import Terms from "./pages/Terms";
import ApplyJob from "./pages/ApplyJob";
import Applications from "./pages/Applications";

// Auth Pages
import CandidatesLogin from "./pages/CandidatesLogin";
import CandidatesSignup from "./pages/CandidatesSignup";
import RecruiterLogin from "./pages/RecruiterLogin";
import RecruiterSignup from "./pages/RecruiterSignup";
import ForgotPassword from "./pages/ForgotPassword";

// Candidate App Pages
import Overview from "./pages/app/Overview";
import Assistant from "./pages/app/Assistant";
import Jobs from "./pages/app/Jobs";
import ApplicationsKanban from "./pages/app/ApplicationsKanban";
import Profile from "./pages/app/Profile";

// Recruiter Dashboard Pages
import Dashborad from "./pages/Dashborad";
import AddJobs from "./pages/AddJobs";
import ManageJobs from "./pages/ManageJobs";
import ViewApplications from "./pages/ViewApplications";

const App = () => {
  return (
    <Routes>
      {/* 1. Candidate App Shell (Protected, role="student") */}
      <Route
        path="/app"
        element={
          <ProtectedRoute role="student">
            <CandidateLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Overview />} />
        <Route path="assistant" element={<Assistant />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="applications" element={<ApplicationsKanban />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* 2. Recruiter App Shell (Protected, role="recruiter") */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="recruiter">
            <Dashborad />
          </ProtectedRoute>
        }
      >
        <Route index element={<ManageJobs />} />
        <Route path="manage-jobs" element={<ManageJobs />} />
        <Route path="add-job" element={<AddJobs />} />
        <Route path="view-applications" element={<ViewApplications />} />
      </Route>

      {/* 3. Public Marketing Site (Wrapped in AppLayout) */}
      <Route
        path="*"
        element={
          <AppLayout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/all-jobs/:category" element={<AllJobs />} />
              <Route path="/jobs" element={<AllJobs />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route path="/apply-job/:id" element={<ApplyJob />} />
              <Route path="/applications" element={<Navigate to="/app/applications" replace />} />
              <Route path="/candidate-login" element={<CandidatesLogin />} />
              <Route path="/candidate-signup" element={<CandidatesSignup />} />
              <Route path="/recruiter-login" element={<RecruiterLogin />} />
              <Route path="/recruiter-signup" element={<RecruiterSignup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Routes>
          </AppLayout>
        }
      />
    </Routes>
  );
};

export default App;
