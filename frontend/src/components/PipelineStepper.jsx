import React from "react";
import { Check, Loader2, FileUp, Sparkles, Cpu, CheckCircle2 } from "lucide-react";

const PipelineStepper = ({ currentStep = 4, isProcessing = false, progress = 100 }) => {
  const steps = [
    {
      id: 1,
      title: "Uploaded",
      subtitle: "PDF saved to disk",
      icon: FileUp,
    },
    {
      id: 2,
      title: "Parsing",
      subtitle: "Gemini 3.1 extraction",
      icon: Sparkles,
    },
    {
      id: 3,
      title: "Embedding",
      subtitle: "Multi-vector generation",
      icon: Cpu,
    },
    {
      id: 4,
      title: "Ready",
      subtitle: "FAISS indexed",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
            Async BullMQ Extraction Pipeline
          </h3>
          <p className="text-xs font-bold text-slate-700 mt-0.5">
            {isProcessing ? "Processing Resume in Real-Time..." : "Profile Pipeline Fully Indexed & Ready"}
          </p>
        </div>
        {isProcessing && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-bold border border-indigo-200 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Worker Active ({progress}%)</span>
          </span>
        )}
      </div>

      {/* Stepper Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const isCompleted = currentStep > step.id || (!isProcessing && currentStep === 4);
          const isActive = isProcessing && currentStep === step.id;
          const isPending = !isCompleted && !isActive;
          const Icon = step.icon;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                isCompleted
                  ? "bg-emerald-50/50 border-emerald-200/80 text-emerald-900"
                  : isActive
                  ? "bg-indigo-50/80 border-indigo-300 text-indigo-900 shadow-xs ring-2 ring-indigo-500/20"
                  : "bg-slate-50/60 border-slate-200/60 text-slate-400"
              }`}
            >
              {/* Step Circle Indicator */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                  isCompleted
                    ? "bg-emerald-600 text-white shadow-xs"
                    : isActive
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-white border border-slate-200 text-slate-400"
                }`}
              >
                {isCompleted ? (
                  <Check size={16} className="stroke-[3]" />
                ) : isActive ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  step.id
                )}
              </div>

              {/* Step Labels */}
              <div className="min-w-0">
                <p
                  className={`text-xs font-extrabold truncate ${
                    isCompleted
                      ? "text-emerald-900"
                      : isActive
                      ? "text-indigo-900"
                      : "text-slate-500"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {step.subtitle}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PipelineStepper;
