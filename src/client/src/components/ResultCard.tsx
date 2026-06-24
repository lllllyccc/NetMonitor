import type { ReactNode } from "react";

interface ResultCardProps {
  title: string;
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function ResultCard({ title, children, className = "", delay = 0 }: ResultCardProps) {
  return (
    <div
      className={`card animate-fade-in-up ${className}`}
      style={{ animationDelay: `${delay}s`, opacity: 0 }}
    >
      {title && (
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent/60" />
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}
