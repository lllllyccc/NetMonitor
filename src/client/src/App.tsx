import { useState } from "react";
import { Routes, Route, NavLink, useLocation } from "react-router-dom";
import { IpLookupPage } from "./pages/IpLookupPage";
import { TlsCheckPage } from "./pages/TlsCheckPage";
import { HttpHeadersPage } from "./pages/HttpHeadersPage";
import { EchCheckPage } from "./pages/EchCheckPage";
import { SpeedTestPage } from "./pages/SpeedTestPage";
import { HistoryPage } from "./pages/HistoryPage";
import { DnsLeakPage } from "./pages/DnsLeakPage";
import { PingPage } from "./pages/PingPage";
import { LegalPage } from "./pages/LegalPage";
import { ChangelogPage } from "./pages/ChangelogPage";
import { useLocale } from "./hooks/useLocale";
import { useTheme } from "./hooks/useTheme";
import { CopyableText } from "./components/CopyableText";
import { LegalModal } from "./components/LegalModal";

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(() => {
    return localStorage.getItem("netmonitor_skip_legal") !== "true";
  });
  const { t, locale, setLocale } = useLocale();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  const handleLegalAgree = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem("netmonitor_skip_legal", "true");
    }
    setShowLegalModal(false);
  };

  const NAV_ITEMS = [
    { path: "/", label: t("nav.ipLookup"), icon: "\u{1F50D}" },
    { path: "/tls", label: t("nav.tlsCheck"), icon: "\u{1F512}" },
    { path: "/headers", label: t("nav.httpHeaders"), icon: "\u{1F6E1}" },
    { path: "/ech", label: t("nav.echDetection"), icon: "\u{1F510}" },
    { path: "/speedtest", label: t("nav.speedTest"), icon: "\u{26A1}" },
    { path: "/dns", label: t("nav.dnsLeak"), icon: "\u{1F6E1}" },
    { path: "/ping", label: t("nav.pingTraceroute"), icon: "\u{1F4E1}" },
    { path: "/history", label: t("nav.history"), icon: "\u{1F4CB}" },
  ];

  return (
    <div className="flex min-h-screen relative">
      {/* Legal modal — first visit */}
      {showLegalModal && <LegalModal onAgree={handleLegalAgree} />}

      {/* Animated particle background */}
      <AnimatedBackground />

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-56 bg-surface-1/90 border-r border-surface-3/50 flex flex-col shrink-0 transform transition-all duration-300 ease-spring lg:transform-none sidebar-glow ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
        style={{ backdropFilter: "blur(20px) saturate(1.5)" }}
      >
        <div className="p-5 border-b border-surface-3/50 gradient-border flex items-center justify-between">
          <div className="animate-fade-in-down">
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-accent-bright animate-glow-pulse inline-block">&gt;</span>{" "}
              <span className="bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">
                NetMonitor
              </span>
            </h1>
            <p className="text-xs text-gray-500 mt-1">{t("app.subtitle")}</p>
          </div>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-200 p-1 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            {"\u2715"}
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto min-h-0">
          {NAV_ITEMS.map((item, index) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-300 animate-slide-in-left ${
                  isActive
                    ? "bg-accent/10 text-accent border border-accent/20 nav-active-indicator shadow-glow-sm"
                    : "text-gray-400 hover:text-gray-200 hover:bg-surface-2/80 border border-transparent"
                }`
              }
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="text-base transition-transform duration-300 hover:scale-110">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
          {/* UA — inside scrollable area */}
          <div className="mt-2 px-3 py-2 rounded-lg bg-surface-2/50 border border-surface-3/30">
            <div className="text-[10px] text-gray-600 uppercase tracking-wider mb-0.5">User-Agent</div>
            <div className="text-[10px] text-gray-400 font-mono leading-snug break-all" title={navigator.userAgent}>
              <CopyableText className="text-[10px]">{navigator.userAgent}</CopyableText>
            </div>
          </div>
        </nav>
        <div className="p-4 border-t border-surface-3/50 text-xs text-gray-600 animate-fade-in" style={{ animationDelay: "0.5s" }}>
          <div className="accent-line mb-3" />
          <div className="flex items-center justify-between mb-2">
            <span>NetMonitor {t("app.version")}</span>
            <div className="flex gap-1">
              <button
                onClick={toggleTheme}
                className="px-2 py-0.5 rounded bg-surface-3/60 hover:bg-surface-4/80 text-gray-400 hover:text-gray-200 transition-all duration-300 text-xs border border-surface-4/30 hover:border-surface-4/60"
                title={theme === "dark" ? "Switch to light mode" : "切换到深色模式"}
              >
                {theme === "dark" ? "\u2600" : "\u263E"}
              </button>
              <button
                onClick={() => setLocale(locale === "zh-CN" ? "en" : "zh-CN")}
                className="px-2 py-0.5 rounded bg-surface-3/60 hover:bg-surface-4/80 text-gray-400 hover:text-gray-200 transition-all duration-300 text-xs border border-surface-4/30 hover:border-surface-4/60"
                title={locale === "zh-CN" ? "Switch to English" : "切换到简体中文"}
              >
                {locale === "zh-CN" ? "EN" : "中文"}
              </button>
            </div>
          </div>
          <div className="flex gap-3">
            <NavLink
              to="/legal"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-accent transition-colors"
            >
              {locale === "zh-CN" ? "法律声明" : "Legal"}
            </NavLink>
            <NavLink
              to="/changelog"
              onClick={() => setSidebarOpen(false)}
              className="text-gray-500 hover:text-accent transition-colors"
            >
              {locale === "zh-CN" ? "更新日志" : "Changelog"}
            </NavLink>
          </div>
          <div className="mt-2 text-[10px] text-gray-600 space-y-0.5">
            <div>&copy; {new Date().getFullYear()} lllllyccc. All Rights Reserved.</div>
            <a href="mailto:contact@lllllyccc.qzz.io" className="hover:text-accent transition-colors">
              contact@lllllyccc.qzz.io
            </a>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative z-10">
        {/* Mobile header */}
        <div className="lg:hidden flex items-center gap-3 p-4 border-b border-surface-3/50 bg-surface-1/80" style={{ backdropFilter: "blur(16px)" }}>
          <button
            className="text-gray-300 hover:text-accent p-1 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">
            &gt; NetMonitor
          </span>
        </div>

        <div className="max-w-4xl mx-auto p-4 lg:p-8">
          <PageTransition>
            <Routes location={location}>
              <Route path="/" element={<IpLookupPage />} />
              <Route path="/tls" element={<TlsCheckPage />} />
              <Route path="/headers" element={<HttpHeadersPage />} />
              <Route path="/ech" element={<EchCheckPage />} />
              <Route path="/speedtest" element={<SpeedTestPage />} />
              <Route path="/dns" element={<DnsLeakPage />} />
              <Route path="/ping" element={<PingPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/legal" element={<LegalPage />} />
              <Route path="/changelog" element={<ChangelogPage />} />
            </Routes>
          </PageTransition>
        </div>
      </main>
    </div>
  );
}
import { AnimatedBackground } from "./components/AnimatedBackground";
import { PageTransition } from "./components/PageTransition";
