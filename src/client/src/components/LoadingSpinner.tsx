export function LoadingSpinner({ text = "Scanning..." }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-12 animate-fade-in">
      {/* Orbital spinner */}
      <div className="relative w-16 h-16">
        {/* Outer ring */}
        <div className="absolute inset-0 rounded-full border-2 border-surface-3" />
        {/* Spinning gradient arc */}
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{
            borderTopColor: "#00d4aa",
            borderRightColor: "rgba(0,212,170,0.3)",
          }}
        />
        {/* Inner glow */}
        <div className="absolute inset-2 rounded-full bg-accent/5 animate-glow-pulse" />
        {/* Center dot */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        </div>
        {/* Orbiting dots */}
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "1.5s" }}>
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-accent shadow-glow-sm" />
        </div>
        <div className="absolute inset-0 animate-spin" style={{ animationDuration: "2s", animationDirection: "reverse" }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 w-1.5 h-1.5 rounded-full bg-violet shadow-glow-violet" />
        </div>
      </div>

      {/* Text with shimmer */}
      <div className="text-center">
        <span className="text-sm font-mono text-gray-400 animate-pulse">{text}</span>
        {/* Shimmer bar below */}
        <div className="mt-3 w-48 h-1 rounded-full shimmer-bar mx-auto" />
      </div>
    </div>
  );
}
