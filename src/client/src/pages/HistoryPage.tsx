import { useState, useCallback } from "react";
import { getHistory, deleteHistory } from "../lib/history";
import { ResultCard } from "../components/ResultCard";
import { StatusIcon } from "../components/StatusIcon";
import { GradeBadge } from "../components/GradeBadge";
import { useLocale } from "../hooks/useLocale";
import type { HistoryEntry } from "@shared/types";

const TOOL_ICONS: Record<string, string> = {
  ip: "\u{1F50D}",
  tls: "\u{1F512}",
  headers: "\u{1F6E1}",
  ech: "\u{1F510}",
  speedtest: "\u{26A1}",
  dns: "\u{1F6E1}",
  ping: "\u{1F4E1}",
};

const TOOL_NAMES: Record<string, string> = {
  ip: "nav.ipLookup",
  tls: "nav.tlsCheck",
  headers: "nav.httpHeaders",
  ech: "nav.echDetection",
  speedtest: "nav.speedTest",
  dns: "nav.dnsLeak",
  ping: "nav.pingTraceroute",
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

function ToolSummary({ tool, result }: { tool: string; result: unknown }) {
  const r = result as Record<string, unknown>;
  if (!r) return null;

  switch (tool) {
    case "ip": {
      const d = r as { ip?: string; city?: string; country?: string; isp?: string; isProxy?: boolean; isVpn?: boolean; isTor?: boolean };
      return (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-mono font-semibold text-accent">{d.ip}</span>
          </div>
          <div className="text-gray-400">{[d.city, d.country].filter(Boolean).join(", ")}</div>
          <div className="text-gray-500">{d.isp}</div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-xs"><StatusIcon status={!d.isProxy} /> Proxy</span>
            <span className="flex items-center gap-1 text-xs"><StatusIcon status={!d.isVpn} /> VPN</span>
            <span className="flex items-center gap-1 text-xs"><StatusIcon status={!d.isTor} /> Tor</span>
          </div>
        </div>
      );
    }
    case "tls": {
      const d = r as { host?: string; grade?: string; protocol?: string; certificate?: { subject?: string; daysRemaining?: number }; issues?: string[] };
      return (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-3">
            {d.grade && <GradeBadge grade={d.grade} size="sm" />}
            <span className="font-mono">{d.host}</span>
          </div>
          <div className="text-gray-400">{d.protocol} &middot; {d.certificate?.subject}</div>
          <div className="flex items-center gap-2 text-xs">
            <span className={d.certificate?.daysRemaining !== undefined && d.certificate.daysRemaining < 30 ? "text-warn" : "text-gray-500"}>
              {d.certificate?.daysRemaining}d remaining
            </span>
            {d.issues && d.issues.length > 0 && (
              <span className="text-warn">{d.issues.length} issue{d.issues.length > 1 ? "s" : ""}</span>
            )}
          </div>
        </div>
      );
    }
    case "headers": {
      const d = r as { url?: string; grade?: string; score?: number; statusCode?: number; headers?: Array<{ name: string; present: boolean }> };
      const present = d.headers?.filter((h) => h.present).length ?? 0;
      const total = d.headers?.length ?? 0;
      return (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-3">
            {d.grade && <GradeBadge grade={d.grade} size="sm" />}
            <span className="font-mono truncate">{d.url}</span>
          </div>
          <div className="text-gray-400">HTTP {d.statusCode} &middot; Score {d.score}%</div>
          <div className="text-xs text-gray-500">{present}/{total} security headers present</div>
        </div>
      );
    }
    case "ech": {
      const d = r as { host?: string; grade?: string; echSupported?: boolean; dnsHttpsRecord?: boolean; tlsEchDetected?: boolean };
      return (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-3">
            {d.grade && <GradeBadge grade={d.grade} size="sm" />}
            <span className="font-mono">{d.host}</span>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1"><StatusIcon status={d.echSupported ?? false} /> ECH</span>
            <span className="flex items-center gap-1"><StatusIcon status={d.dnsHttpsRecord ?? false} /> DNS HTTPS</span>
            <span className="flex items-center gap-1"><StatusIcon status={d.tlsEchDetected ?? false} /> TLS ECH</span>
          </div>
        </div>
      );
    }
    case "speedtest": {
      const d = r as { downloadMbps?: number; uploadMbps?: number; latencyMs?: number; jitterMs?: number };
      return (
        <div className="grid grid-cols-4 gap-3 text-sm text-center">
          <div>
            <div className="text-accent font-semibold">{d.downloadMbps?.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Mbps ↓</div>
          </div>
          <div>
            <div className="text-accent font-semibold">{d.uploadMbps?.toFixed(1)}</div>
            <div className="text-xs text-gray-500">Mbps ↑</div>
          </div>
          <div>
            <div className="text-gray-200">{d.latencyMs?.toFixed(0)}</div>
            <div className="text-xs text-gray-500">ms</div>
          </div>
          <div>
            <div className="text-gray-200">{d.jitterMs?.toFixed(0)}</div>
            <div className="text-xs text-gray-500">jitter</div>
          </div>
        </div>
      );
    }
    case "dns": {
      const d = r as { grade?: string; leakDetected?: boolean; detectedServers?: Array<{ address: string; provider: string; type: string }> };
      return (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-3">
            {d.grade && <GradeBadge grade={d.grade} size="sm" />}
            <span className={d.leakDetected ? "text-danger" : "text-emerald-400"}>
              {d.leakDetected ? "Leak detected" : "No leak"}
            </span>
          </div>
          <div className="text-gray-500 text-xs">{d.detectedServers?.length} DNS server(s)</div>
        </div>
      );
    }
    case "ping": {
      const d = r as { host?: string; avgMs?: number; packetLossPercent?: number; status?: string; totalHops?: number; hops?: unknown[] };
      if (d.totalHops !== undefined) {
        return (
          <div className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <StatusIcon status={d.status === "success"} />
              <span className="font-mono">{d.host}</span>
            </div>
            <div className="text-gray-400">{d.totalHops} hops &middot; {d.status}</div>
          </div>
        );
      }
      return (
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <StatusIcon status={d.status === "success"} />
            <span className="font-mono">{d.host}</span>
          </div>
          <div className="text-gray-400">
            {d.avgMs}ms avg &middot; {d.packetLossPercent}% loss
          </div>
        </div>
      );
    }
    default:
      return <pre className="text-xs text-gray-500 bg-surface-0 rounded p-2 overflow-x-auto max-h-24">{JSON.stringify(r, null, 2)}</pre>;
  }
}

export function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>(() => getHistory());
  const { t } = useLocale();

  const handleRefresh = useCallback(() => {
    setEntries(getHistory());
  }, []);

  const deleteEntry = useCallback((id: string) => {
    deleteHistory(id);
    setEntries((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <div className="space-y-6 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("history.title")}</h2>
          <p className="text-sm text-gray-500 mt-1">{t("history.description")}</p>
        </div>
        <button onClick={handleRefresh} className="btn-secondary text-sm">
          {t("history.refresh")}
        </button>
      </div>

      {entries.length === 0 && (
        <div className="card text-center py-12 text-gray-500">
          <p className="text-lg mb-1">{t("history.emptyTitle")}</p>
          <p className="text-sm">{t("history.emptyDesc")}</p>
        </div>
      )}

      {entries.map((entry, i) => (
        <ResultCard key={entry.id} title="" delay={Math.min(i * 0.03, 0.3)}>
          <div className="flex items-start gap-4">
            <span className="text-2xl shrink-0 mt-0.5">{TOOL_ICONS[entry.tool] || "\u{1F4CB}"}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-gray-100">
                  {t(TOOL_NAMES[entry.tool] || entry.tool)}
                </span>
                {entry.target && entry.target !== "system" && entry.target !== "speedtest" && (
                  <span className="text-xs font-mono text-gray-500 truncate">{entry.target}</span>
                )}
                <span className="text-xs text-gray-600 ml-auto shrink-0">{formatTime(entry.createdAt)}</span>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-gray-600 hover:text-danger text-xs px-1 transition-colors shrink-0"
                  title="Delete"
                >
                  &#10005;
                </button>
              </div>
              <ToolSummary tool={entry.tool} result={entry.result} />
            </div>
          </div>
        </ResultCard>
      ))}
    </div>
  );
}
