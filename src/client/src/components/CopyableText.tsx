import { useState, type ReactNode } from "react";

interface CopyableTextProps {
  children: ReactNode;
  copyText?: string;
  className?: string;
  label?: string;
}

export function CopyableText({ children, copyText, className = "", label }: CopyableTextProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const text = copyText ?? (typeof children === "string" ? children : String(children));
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <span
      onClick={handleCopy}
      title={label || "Click to copy"}
      className={`cursor-pointer hover:bg-accent/10 transition-colors rounded px-0.5 -mx-0.5 select-all relative group ${className}`}
    >
      {children}
      <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-[10px] bg-surface-4 text-gray-300 px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {copied ? "Copied!" : "Click to copy"}
      </span>
    </span>
  );
}
