import React from "react";

const MatchGauge = ({ score = 85, size = 44 }) => {
  const radius = (size - 6) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(100, score || 75));
  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  // Dynamic color coding
  const getColor = (s) => {
    if (s >= 85) return { stroke: "#10B981", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (s >= 70) return { stroke: "#6366F1", bg: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    return { stroke: "#F59E0B", bg: "bg-amber-50 text-amber-700 border-amber-200" };
  };

  const colorConfig = getColor(clampedScore);

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E2E8F0"
          strokeWidth="3.5"
          fill="transparent"
        />
        {/* Progress arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorConfig.stroke}
          strokeWidth="3.5"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-[11px] font-black text-slate-900">
        {clampedScore}%
      </span>
    </div>
  );
};

export default MatchGauge;
