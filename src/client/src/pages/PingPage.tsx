import { useState } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { useApi } from "../hooks/useApi";
import { ResultCard } from "../components/ResultCard";
import { CopyableText } from "../components/CopyableText";
import { StatusIcon } from "../components/StatusIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import type { PingResult, TracerouteResult } from "@shared/types";

type Mode = "ping" | "traceroute";

export function PingPage() {
  const [mode, setMode] = useState<Mode>("ping");
  const [host, setHost] = useState("");
  const [count, setCount] = useState(4);
  const [maxHops, setMaxHops] = useState(20);

  const pingApi = useApi<PingResult>();
  const tracerouteApi = useApi<TracerouteResult>();
  const { t } = useLocale();

  const activeApi = mode === "ping" ? pingApi : tracerouteApi;

  const handleRun = async () => {
    if (!host.trim()) return;

    if (mode === "ping") {
      try {
        const result = await pingApi.execute(() =>
          apiGet<PingResult>("/api/ping/ping", { host, count: String(count) })
        );
        saveHistory("ping", host, result);
      } catch {
        // error handled by useApi
      }
    } else {
      try {
        const result = await tracerouteApi.execute(() =>
          apiGet<TracerouteResult>("/api/ping/traceroute", { host, maxHops: String(maxHops) })
        );
        saveHistory("ping", host, result);
      } catch {
        // error handled by useApi
      }
    }
  };

  const reset = () => {
    if (mode === "ping") pingApi.reset();
    else tracerouteApi.reset();
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("ping.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("ping.description")}</p>
      </div>

      {/* Mode toggle */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex bg-surface-2 rounded-lg p-0.5 shrink-0">
            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                mode === "ping"
                  ? "bg-accent text-surface-0"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => { setMode("ping"); reset(); }}
            >
              Ping
            </button>
            <button
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                mode === "traceroute"
                  ? "bg-accent text-surface-0"
                  : "text-gray-400 hover:text-gray-200"
              }`}
              onClick={() => { setMode("traceroute"); reset(); }}
            >
              Traceroute
            </button>
          </div>

          <div className="flex-1 flex gap-3 items-end">
            <div className="flex-1">
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRun()}
                placeholder={t("ping.placeholder")}
                className="input-field"
              />
            </div>

            {mode === "ping" && (
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-gray-500">{t("ping.count")}</label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-20 accent-accent"
                />
                <span className="text-xs font-mono text-gray-400 w-4">{count}</span>
              </div>
            )}

            {mode === "traceroute" && (
              <div className="flex items-center gap-2 shrink-0">
                <label className="text-xs text-gray-500">{t("ping.maxHops")}</label>
                <input
                  type="range"
                  min={5}
                  max={30}
                  value={maxHops}
                  onChange={(e) => setMaxHops(Number(e.target.value))}
                  className="w-20 accent-accent"
                />
                <span className="text-xs font-mono text-gray-400 w-6">{maxHops}</span>
              </div>
            )}

            <button onClick={handleRun} disabled={activeApi.loading || !host.trim()} className="btn-primary whitespace-nowrap">
              {activeApi.loading
                ? (mode === "ping" ? t("ping.buttonPinging") : t("ping.buttonTracing"))
                : (mode === "ping" ? t("ping.buttonPing") : t("ping.buttonTrace"))}
            </button>
          </div>
        </div>
      </div>

      {activeApi.loading && (
        <LoadingSpinner text={mode === "ping" ? t("ping.loadingPing") : t("ping.loadingTrace")} />
      )}

      {activeApi.error && (
        <div className="card border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">{activeApi.error}</p>
        </div>
      )}

      {/* Ping Results */}
      {mode === "ping" && pingApi.data && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <ResultCard title={t("ping.minRtt")} delay={0.1}>
              <div className={`text-2xl font-bold ${pingApi.data.minMs === 0 && pingApi.data.status === "success" ? "text-emerald-400" : "text-gray-100"}`}>
                {pingApi.data.minMs.toFixed(1)}
                <span className="text-sm text-gray-500 ml-1">ms</span>
              </div>
            </ResultCard>

            <ResultCard title={t("ping.avgRtt")} delay={0.15}>
              <div className={`text-2xl font-bold ${pingApi.data.avgMs < 50 ? "text-emerald-400" : pingApi.data.avgMs < 150 ? "text-yellow-400" : "text-orange-400"}`}>
                {pingApi.data.avgMs.toFixed(1)}
                <span className="text-sm text-gray-500 ml-1">ms</span>
              </div>
            </ResultCard>

            <ResultCard title={t("ping.maxRtt")} delay={0.2}>
              <div className="text-2xl font-bold text-gray-100">
                {pingApi.data.maxMs.toFixed(1)}
                <span className="text-sm text-gray-500 ml-1">ms</span>
              </div>
            </ResultCard>

            <ResultCard title={t("ping.packetLoss")} delay={0.25}>
              <div className={`text-2xl font-bold ${pingApi.data.packetLossPercent === 0 ? "text-emerald-400" : "text-danger"}`}>
                {pingApi.data.packetLossPercent}
                <span className="text-sm text-gray-500 ml-1">%</span>
              </div>
            </ResultCard>
          </div>

          <ResultCard title={t("ping.stats")} delay={0.3}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t("ping.target")}</span>
                <div className="font-mono"><CopyableText>{pingApi.data.host}</CopyableText></div>
              </div>
              <div>
                <span className="text-gray-500">{t("ping.status")}</span>
                <div className="flex items-center gap-2">
                  <StatusIcon status={pingApi.data.status === "success"} />
                  <span>{t(pingApi.data.status === "success" ? "common.success" : pingApi.data.status === "timeout" ? "common.timeout" : "common.error")}</span>
                </div>
              </div>
              <div>
                <span className="text-gray-500">{t("ping.sentReceived")}</span>
                <div>{pingApi.data.packetsSent} / {pingApi.data.packetsReceived}</div>
              </div>
              {pingApi.data.mdevMs !== undefined && (
                <div>
                  <span className="text-gray-500">{t("ping.stdDev")}</span>
                  <div>{pingApi.data.mdevMs.toFixed(1)} ms</div>
                </div>
              )}
            </div>
          </ResultCard>
        </>
      )}

      {/* Traceroute Results */}
      {mode === "traceroute" && tracerouteApi.data && (
        <>
          <ResultCard title={t("ping.summary")} delay={0.1}>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">{t("ping.target")}</span>
                <div className="font-mono"><CopyableText>{tracerouteApi.data.host}</CopyableText></div>
              </div>
              {tracerouteApi.data.targetIp && (
                <div>
                  <span className="text-gray-500">{t("ping.target")} IP</span>
                  <div className="font-mono">{tracerouteApi.data.targetIp}</div>
                </div>
              )}
              <div>
                <span className="text-gray-500">{t("ping.hop")}s</span>
                <div>{tracerouteApi.data.totalHops}</div>
              </div>
              <div>
                <span className="text-gray-500">{t("ping.status")}</span>
                <div className="flex items-center gap-2">
                  <StatusIcon
                    status={tracerouteApi.data.status === "success" ? true : tracerouteApi.data.status === "incomplete" ? "warn" : false}
                  />
                  <span>{t(tracerouteApi.data.status === "success" ? "common.success" : tracerouteApi.data.status === "incomplete" ? "common.incomplete" : "common.error")}</span>
                </div>
              </div>
            </div>
            {tracerouteApi.data.error && (
              <p className="text-xs text-gray-500 mt-2">{tracerouteApi.data.error}</p>
            )}
          </ResultCard>

          <ResultCard title={t("ping.hopDetails")} delay={0.15}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-surface-3">
                    <th className="text-left py-2 pr-3 w-12">{t("ping.hop")}</th>
                    <th className="text-left py-2 pr-4">IP / Host</th>
                    <th className="text-right py-2 pr-3">{t("ping.rtt1")}</th>
                    <th className="text-right py-2 pr-3">{t("ping.rtt2")}</th>
                    <th className="text-right py-2">{t("ping.rtt3")}</th>
                  </tr>
                </thead>
                <tbody>
                  {tracerouteApi.data.hops.map((hop) => (
                    <tr key={hop.hop} className="border-b border-surface-3 last:border-0">
                      <td className="py-2 pr-3 text-gray-500 font-mono text-xs">{hop.hop}</td>
                      <td className={`py-2 pr-4 font-mono text-xs ${hop.isTimeout ? "text-gray-600" : "text-gray-200"}`}>
                        {hop.isTimeout ? "*" : <CopyableText>{hop.ip || hop.hostname || "*"}</CopyableText>}
                      </td>
                      <td className={`py-2 pr-3 text-right font-mono text-xs ${formatRttColor(hop.rtt1)}`}>
                        {hop.rtt1 !== undefined ? `${hop.rtt1.toFixed(1)} ms` : "*"}
                      </td>
                      <td className={`py-2 pr-3 text-right font-mono text-xs ${formatRttColor(hop.rtt2)}`}>
                        {hop.rtt2 !== undefined ? `${hop.rtt2.toFixed(1)} ms` : "*"}
                      </td>
                      <td className={`py-2 text-right font-mono text-xs ${formatRttColor(hop.rtt3)}`}>
                        {hop.rtt3 !== undefined ? `${hop.rtt3.toFixed(1)} ms` : "*"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultCard>
        </>
      )}
    </div>
  );
}

function formatRttColor(rtt: number | undefined): string {
  if (rtt === undefined) return "text-gray-600";
  if (rtt < 20) return "text-emerald-400";
  if (rtt < 80) return "text-yellow-400";
  if (rtt < 200) return "text-orange-400";
  return "text-danger";
}
