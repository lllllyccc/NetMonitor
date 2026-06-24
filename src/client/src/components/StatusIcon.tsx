interface StatusIconProps {
  status: boolean | "warn" | "info";
  className?: string;
}

export function StatusIcon({ status, className = "" }: StatusIconProps) {
  if (status === true) {
    return (
      <span className={`text-emerald-400 inline-flex items-center justify-center ${className}`}>
        <span className="relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400/30" />
          <span className="relative">&#10003;</span>
        </span>
      </span>
    );
  }
  if (status === "warn") {
    return (
      <span className={`text-yellow-400 inline-flex items-center animate-bounce-subtle ${className}`}>
        &#9888;
      </span>
    );
  }
  if (status === "info") {
    return <span className={`text-gray-500 ${className}`}>&#8505;</span>;
  }
  return <span className={`text-red-400 ${className}`}>&#10007;</span>;
}
