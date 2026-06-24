import plugin from "tailwindcss/plugin";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/client/index.html", "./src/client/src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        surface: {
          0: "#06060c",
          1: "#0d0d15",
          2: "#14141f",
          3: "#1c1c2b",
          4: "#252538",
          5: "#2e2e45",
        },
        accent: {
          DEFAULT: "#00d4aa",
          dim: "#00b894",
          bright: "#00ffc8",
          glow: "rgba(0,212,170,0.15)",
        },
        violet: {
          DEFAULT: "#8b5cf6",
          dim: "#7c3aed",
          bright: "#a78bfa",
        },
        danger: "#ff4757",
        warn: "#ffa502",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ['"Inter"', '"Noto Sans SC"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
        display: ['"Inter"', '"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-in-down": "fadeInDown 0.4s ease-out forwards",
        "slide-in-left": "slideInLeft 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "slide-in-right": "slideInRight 0.4s cubic-bezier(0.16,1,0.3,1) forwards",
        "scale-in": "scaleIn 0.35s cubic-bezier(0.16,1,0.3,1) forwards",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "glow-breathe": "glowBreathe 4s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "shimmer-bar": "shimmerBar 1.8s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "spin-slow": "spin 3s linear infinite",
        "bounce-subtle": "bounceSubtle 2s ease-in-out infinite",
        "gradient-x": "gradientX 3s ease infinite",
        "gradient-rotate": "gradientRotate 6s linear infinite",
        "blur-in": "blurIn 0.5s cubic-bezier(0.16,1,0.3,1) forwards",
        "count-up": "countUp 0.6s ease-out forwards",
        "scan-line": "scanLine 3s linear infinite",
        "ripple": "ripple 0.6s ease-out",
        "orbit": "orbit 2s linear infinite",
        "dash-draw": "dashDraw 1.5s ease-in-out forwards",
        "border-flow": "borderFlow 3s linear infinite",
        "particle-float": "particleFloat 8s ease-in-out infinite",
        "typewriter": "typewriter 2s steps(20) forwards",
        "magnetic": "magnetic 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(24px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        fadeInDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInLeft: {
          "0%": { opacity: "0", transform: "translateX(-24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        slideInRight: {
          "0%": { opacity: "0", transform: "translateX(24px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.85)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,212,170,0.08)" },
          "50%": { boxShadow: "0 0 40px rgba(0,212,170,0.25)" },
        },
        glowBreathe: {
          "0%, 100%": { boxShadow: "0 0 20px rgba(0,212,170,0.06), inset 0 1px 0 rgba(255,255,255,0.04)" },
          "50%": { boxShadow: "0 0 60px rgba(0,212,170,0.18), inset 0 1px 0 rgba(255,255,255,0.06)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        shimmerBar: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        bounceSubtle: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        gradientX: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        gradientRotate: {
          "0%": { "--angle": "0deg" },
          "100%": { "--angle": "360deg" },
        },
        blurIn: {
          "0%": { opacity: "0", filter: "blur(12px)", transform: "scale(0.96)" },
          "100%": { opacity: "1", filter: "blur(0)", transform: "scale(1)" },
        },
        countUp: {
          "0%": { opacity: "0", transform: "translateY(12px) scale(0.92)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.5" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(12px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(12px) rotate(-360deg)" },
        },
        dashDraw: {
          "0%": { strokeDashoffset: "1000" },
          "100%": { strokeDashoffset: "0" },
        },
        borderFlow: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        particleFloat: {
          "0%, 100%": { transform: "translateY(0) translateX(0)" },
          "25%": { transform: "translateY(-20px) translateX(10px)" },
          "50%": { transform: "translateY(-8px) translateX(-5px)" },
          "75%": { transform: "translateY(-25px) translateX(8px)" },
        },
        typewriter: {
          "0%": { width: "0" },
          "100%": { width: "100%" },
        },
        magnetic: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)" },
        },
      },
      boxShadow: {
        "glow-sm": "0 0 15px rgba(0,212,170,0.15)",
        "glow-md": "0 0 30px rgba(0,212,170,0.2)",
        "glow-lg": "0 0 60px rgba(0,212,170,0.25)",
        "glow-xl": "0 0 80px rgba(0,212,170,0.3), 0 0 120px rgba(0,212,170,0.1)",
        "glow-violet": "0 0 30px rgba(139,92,246,0.2)",
        "inner-glow": "inset 0 1px 0 0 rgba(255,255,255,0.05)",
        "inner-glow-accent": "inset 0 1px 0 0 rgba(0,212,170,0.1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(var(--tw-gradient-stops))",
      },
      backdropBlur: {
        xs: "2px",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.16,1,0.3,1)",
      },
    },
  },
  plugins: [
    plugin(function ({ addUtilities, addComponents }) {
      addUtilities({
        ".glass": {
          background: "rgba(13,13,21,0.7)",
          "backdrop-filter": "blur(20px) saturate(1.8)",
          "-webkit-backdrop-filter": "blur(20px) saturate(1.8)",
        },
        ".glass-strong": {
          background: "rgba(13,13,21,0.85)",
          "backdrop-filter": "blur(30px) saturate(2)",
          "-webkit-backdrop-filter": "blur(30px) saturate(2)",
        },
        ".text-gradient": {
          "background-clip": "text",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
        },
        ".preserve-3d": {
          "transform-style": "preserve-3d",
        },
        ".perspective-1000": {
          perspective: "1000px",
        },
      });
      addComponents({
        ".btn-ripple": {
          position: "relative",
          overflow: "hidden",
        },
        ".btn-ripple::after": {
          content: '""',
          position: "absolute",
          inset: "0",
          background: "radial-gradient(circle, rgba(255,255,255,0.15) 10%, transparent 10.01%)",
          "background-repeat": "no-repeat",
          "background-position": "50%",
          transform: "scale(0)",
          opacity: "0",
          transition: "transform 0.4s, opacity 0.8s",
        },
        ".btn-ripple:active::after": {
          transform: "scale(4)",
          opacity: "0",
          transition: "0s",
        },
      });
    }),
  ],
};
