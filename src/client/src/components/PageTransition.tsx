import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const location = useLocation();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [transitionStage, setTransitionStage] = useState<"enter" | "idle">("enter");

  useEffect(() => {
    setTransitionStage("enter");
    setDisplayChildren(children);
    const timer = setTimeout(() => setTransitionStage("idle"), 500);
    return () => clearTimeout(timer);
  }, [location.pathname, children]);

  return (
    <div
      key={location.pathname}
    className={
      transitionStage === "enter"
        ? "animate-blur-in"
        : ""
    }
    >
      {displayChildren}
    </div>
  );
}
