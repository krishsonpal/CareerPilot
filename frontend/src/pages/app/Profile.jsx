import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { UserCheck, Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { toast } from "react-hot-toast";
import PipelineStepper from "../../components/PipelineStepper";
import ResumeDropzone from "../../components/ResumeDropzone";
import AIProfileCard from "../../components/AIProfileCard";
import api from "../../utils/api";

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(4);
  const [progress, setProgress] = useState(100);

  const pollIntervalRef = useRef(null);

  // Fetch Existing Resume Profile on mount
  const fetchProfile = async () => {
    try {
      setProfileLoading(true);
      const { data } = await api.get("/ai/resume");
      setProfile(data);
      setCurrentStep(4);
      setProgress(100);
      setIsProcessing(false);
    } catch (err) {
      if (err?.response?.status !== 404) {
        toast.error("Failed to load resume profile");
      }
      setProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Poll BullMQ worker task status
  const startPollingTask = (taskId) => {
    setIsProcessing(true);
    setCurrentStep(2);
    setProgress(30);

    let attempts = 0;
    const maxAttempts = 40; // max 60 seconds

    pollIntervalRef.current = setInterval(async () => {
      attempts++;
      try {
        const { data } = await api.get(`/ai/resume/status/${taskId}`);

        if (data.state === "waiting") {
          setCurrentStep(2);
          setProgress(35);
        } else if (data.state === "active") {
          setCurrentStep(3);
          setProgress(70);
        } else if (data.state === "completed") {
          clearInterval(pollIntervalRef.current);
          setCurrentStep(4);
          setProgress(100);
          setIsProcessing(false);
          toast.success("Resume parsed & FAISS embeddings indexed!");
          fetchProfile();
        } else if (data.state === "failed") {
          clearInterval(pollIntervalRef.current);
          setIsProcessing(false);
          toast.error("Resume processing failed in worker queue.");
        }
      } catch (err) {
        if (attempts >= 10) {
          clearInterval(pollIntervalRef.current);
          setIsProcessing(false);
          fetchProfile();
        }
      }

      if (attempts >= maxAttempts) {
        clearInterval(pollIntervalRef.current);
        setIsProcessing(false);
        fetchProfile();
      }
    }, 1500);
  };

  // Upload Resume File Handler
  const handleUpload = async (file) => {
    setIsUploading(true);
    setCurrentStep(1);
    setIsProcessing(true);
    setProgress(15);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const { data } = await api.post("/ai/resume/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data.task_id) {
        toast.success("Resume uploaded! Starting async BullMQ analysis...");
        startPollingTask(data.task_id);
      } else {
        fetchProfile();
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Resume upload failed");
      setIsProcessing(false);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2.5">
          <UserCheck className="text-primary" size={26} />
          <span>AI Resume Profile & Pipeline</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Upload your PDF resume. Our async BullMQ queue parses your skills and computes FAISS multi-vector embeddings.
        </p>
      </div>

      {/* 2. Async Pipeline Stepper Bar */}
      <PipelineStepper
        currentStep={currentStep}
        isProcessing={isProcessing}
        progress={progress}
      />

      {/* 3. Main 2-Column Area: Left Dropzone + Right AI Profile */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Dropzone & Document Management (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <ResumeDropzone
            resumeProfile={profile}
            onUpload={handleUpload}
            isUploading={isUploading || isProcessing}
          />
        </div>

        {/* Right Column: AI Extracted Profile Card (7 cols on lg) */}
        <div className="lg:col-span-7">
          <AIProfileCard
            profile={profile}
            loading={profileLoading && !isProcessing}
          />
        </div>

      </div>

      {/* Next Steps Action Bar (M4) */}
      {profile && !isProcessing && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Your profile is vector-indexed</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Ready to find jobs matched to your skill profile or simulate AI mock interviews?
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Link
              to="/app/assistant"
              className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl border border-border bg-muted hover:bg-muted/80 text-foreground font-bold text-xs transition-colors"
            >
              Ask AI Coach
            </Link>
            <Link
              to="/app/jobs"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs shadow-xs transition-all active:scale-[0.98]"
            >
              <span>Explore Matches</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      )}

    </div>
  );
};

export default Profile;
