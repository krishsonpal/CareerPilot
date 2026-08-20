import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, FileText, Cpu, MessageSquare } from "lucide-react";
import { SlideUp } from "../utils/Animation";

const HowItWorks = () => {
  const steps = [
    {
      number: "1",
      title: "Upload your resume",
      description: "AI parses and builds your profile async via BullMQ + Gemini",
      icon: FileText,
      badge: "Async Queue",
    },
    {
      number: "2",
      title: "Semantic job matching",
      description: "FAISS vector search beyond keyword filtering",
      icon: Cpu,
      badge: "Vector AI",
    },
    {
      number: "3",
      title: "Chat with AI coach",
      description: "LangChain + Socket.IO streaming, context-aware to your resume",
      icon: MessageSquare,
      badge: "Real-time",
    },
  ];

  return (
    <section className="py-14 sm:py-18 bg-card border-y border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Tag */}
        <div className="text-center mb-10">
          <span className="text-xs font-extrabold uppercase tracking-widest text-primary bg-primary/10 px-3.5 py-1 rounded-full border border-primary/20">
            How It Works
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground mt-3">
            Intelligent career acceleration in three steps
          </h2>
        </div>

        {/* 3-Step Horizontal Pipeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.number}
                variants={SlideUp(0.2 + idx * 0.15)}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                className="relative bg-muted/40 hover:bg-card rounded-2xl p-6 border border-border hover:border-primary/40 hover:shadow-sm transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-card shadow-2xs border border-border text-primary font-extrabold flex items-center justify-center text-lg group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      {step.number}
                    </div>
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider bg-card px-2 py-0.5 rounded border border-border">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Step indicator arrow for desktop */}
                {idx < steps.length - 1 && (
                  <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-6 rounded-full bg-card border border-border shadow-2xs items-center justify-center text-muted-foreground">
                    <ArrowRight size={12} />
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
