import React from "react";

const MatchGauge = ({ score = 85, size = 44, strokeWidth = 3.5 }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.min(100, Math.max(0, score));
  const offset = circumference - (clampedScore / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        {/* Background Track Ring */}
        <circle
          className="text-border"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="18"
          cy="18"
        />

        {/* Dynamic Progress Ring */}
        <circle
          className="text-primary transition-all duration-700 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx="18"
          cy="18"
        />
      </svg>

      {/* Center Percentage */}
      <span className="absolute text-[11px] font-black text-foreground">
        {clampedScore}%
      </span>
    </div>
  );
};

export default MatchGauge;
