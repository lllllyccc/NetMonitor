import { useState, useEffect } from "react";

interface GradeBadgeProps {
  grade: string;
  size?: "sm" | "md" | "lg";
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "A+": { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/30", glow: "shadow-[0_0_30px_rgba(16,185,129,0.3)]" },
  A: { bg: "bg-green-500/20", text: "text-green-400", border: "border-green-500/30", glow: "shadow-[0_0_30px_rgba(34,197,94,0.3)]" },
  B: { bg: "bg-yellow-500/20", text: "text-yellow-400", border: "border-yellow-500/30", glow: "shadow-[0_0_25px_rgba(234,179,8,0.25)]" },
  C: { bg: "bg-orange-500/20", text: "text-orange-400", border: "border-orange-500/30", glow: "shadow-[0_0_20px_rgba(249,115,22,0.2)]" },
  D: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/30", glow: "shadow-[0_0_20px_rgba(239,68,68,0.2)]" },
  F: { bg: "bg-red-600/20", text: "text-red-500", border: "border-red-600/30", glow: "shadow-[0_0_20px_rgba(220,38,38,0.2)]" },
};

const SIZE_CLASSES = {
  sm: "w-10 h-10 text-sm",
  md: "w-16 h-16 text-2xl",
  lg: "w-24 h-24 text-4xl",
};

export function GradeBadge({ grade, size = "md" }: GradeBadgeProps) {
  const [mounted, setMounted] = useState(false);
  const colors = GRADE_COLORS[grade] || GRADE_COLORS["F"];

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <span
      className={`grade-badge ${colors.bg} ${colors.text} ${colors.border} ${colors.glow} ${SIZE_CLASSES[size]} border transition-all duration-700 ${
        mounted ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-50 rotate-12"
      }`}
    >
      {grade}
    </span>
  );
}
