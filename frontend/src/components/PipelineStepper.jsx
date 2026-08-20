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
    <div className="bg-card rounded-2xl border border-border p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
            Async BullMQ Extraction Pipeline
          </h3>
          <p className="text-xs font-bold text-foreground mt-0.5">
            {isProcessing ? "Processing Resume in Real-Time..." : "Profile Pipeline Fully Indexed & Ready"}
          </p>
        </div>
        {isProcessing && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold border border-primary/20 animate-pulse">
            <Loader2 size={12} className="animate-spin" />
            <span>Worker Active ({progress}%)</span>
          </span>
        )}
      </div>

      {/* Stepper Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 relative">
        {steps.map((step) => {
          const isCompleted = currentStep > step.id || (!isProcessing && currentStep === 4);
          const isActive = isProcessing && currentStep === step.id;

          return (
            <div
              key={step.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                isCompleted
                  ? "bg-primary/5 border-primary/30 text-foreground"
                  : isActive
                  ? "bg-primary/10 border-primary text-foreground shadow-xs ring-2 ring-primary/20"
                  : "bg-muted/40 border-border text-muted-foreground"
              }`}
            >
              {/* Step Circle Indicator */}
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                  isCompleted
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-card border border-border text-muted-foreground"
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
                    isCompleted || isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
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
