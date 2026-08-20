import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, RefreshCw, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

const ResumeDropzone = ({ resumeProfile, onUpload, isUploading }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isReplaceMode, setIsReplaceMode] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    const validTypes = ["application/pdf", "text/plain"];
    const ext = file.name.split(".").pop().toLowerCase();

    if (!validTypes.includes(file.type) && !["pdf", "txt"].includes(ext)) {
      toast.error("Only PDF or TXT resume files are supported");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size exceeds maximum limit of 10MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadSubmit = () => {
    if (!selectedFile) {
      toast.error("Please select a resume file to upload");
      return;
    }
    onUpload(selectedFile);
    setSelectedFile(null);
    setIsReplaceMode(false);
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";
    const k = 1024;
    const dm = 1;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const getPdfUrl = (url) => {
    if (!url) return "#";
    if (url.startsWith("http")) return url;
    const base = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";
    return `${base.replace(/\/api\/?$/, "")}${url}`;
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText size={16} className="text-primary" />
          <span>Resume Document</span>
        </h3>
        {resumeProfile && !isReplaceMode && (
          <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 flex items-center gap-1">
            <CheckCircle2 size={11} /> Verified Active
          </span>
        )}
      </div>

      {/* State 1: Resume already exists and user is NOT in replace mode */}
      {resumeProfile && !isReplaceMode && (
        <div className="space-y-4">
          <div className="p-4 bg-muted/40 rounded-2xl border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0 border border-primary/20">
                PDF
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-foreground truncate">
                  {resumeProfile.resume_url?.split("/").pop() || "Uploaded_Resume.pdf"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Parsed by Gemini 3.1 • FAISS Indexed
                </p>
              </div>
            </div>

            {resumeProfile.resume_url && (
              <a
                href={getPdfUrl(resumeProfile.resume_url)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-xl bg-card border border-border text-foreground hover:text-primary hover:border-primary/40 shadow-2xs transition-all shrink-0"
                title="View PDF"
              >
                <ExternalLink size={15} />
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsReplaceMode(true)}
            className="w-full py-2.5 px-4 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <RefreshCw size={13} />
            <span>Upload New Version / Replace Resume</span>
          </button>
        </div>
      )}

      {/* State 2: No resume uploaded yet OR user clicked Replace Resume */}
      {(!resumeProfile || isReplaceMode) && (
        <div className="space-y-4">
          {/* Dropzone Container */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
              isDragOver
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border hover:border-primary/40 hover:bg-muted/30"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.txt,application/pdf,text/plain"
              className="hidden"
            />

            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-2xs">
              <UploadCloud size={24} />
            </div>

            <p className="text-xs font-bold text-foreground mb-1">
              Drag & drop your resume PDF here or <span className="text-primary underline">Browse Files</span>
            </p>
            <p className="text-[11px] text-muted-foreground">
              Supports PDF or TXT up to 10MB
            </p>
          </div>

          {/* Selected File Preview */}
          {selectedFile && (
            <div className="p-3 bg-primary/5 rounded-xl border border-primary/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <FileText size={16} className="text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-primary">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFile(null);
                }}
                className="text-muted-foreground hover:text-destructive p-1 cursor-pointer"
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            {isReplaceMode && (
              <button
                type="button"
                onClick={() => {
                  setIsReplaceMode(false);
                  setSelectedFile(null);
                }}
                className="py-2.5 px-4 bg-muted hover:bg-muted/80 text-muted-foreground text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
            )}

            <button
              type="button"
              disabled={!selectedFile || isUploading}
              onClick={handleUploadSubmit}
              className={`flex-1 py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                !selectedFile || isUploading ? "opacity-50 cursor-not-allowed" : "active:scale-[0.98]"
              }`}
            >
              <UploadCloud size={14} />
              <span>{isUploading ? "Uploading & Enqueueing..." : "Process with AI"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeDropzone;
