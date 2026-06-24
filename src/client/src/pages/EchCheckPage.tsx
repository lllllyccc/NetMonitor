import { useState, useEffect } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { useApi } from "../hooks/useApi";
import { ResultCard } from "../components/ResultCard";
import { CopyableText } from "../components/CopyableText";
import { GradeBadge } from "../components/GradeBadge";
import { StatusIcon } from "../components/StatusIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import { detectClientEch } from "../lib/client-ech";
import type { EchCheckResult, EchProbeResult, ClientEchInfo } from "@shared/types";

export function EchCheckPage() {
  const [host, setHost] = useState("");
  const [clientEch, setClientEch] = useState<ClientEchInfo | null>(null);
  const basicApi = useApi<EchCheckResult>();
  const probeApi = useApi<EchProbeResult>();
  const { t } = useLocale();

  useEffect(() => {
    detectClientEch().then(setClientEch);
  }, []);

  const handleCheck = async () => {
    if (!host.trim()) return;
    const h = host.trim();
    try {
      const [basicResult, probeResult] = await Promise.all([
        basicApi.execute(() => apiGet<EchCheckResult>("/api/ech/check", { host: h })),
        probeApi.execute(() => apiGet<EchProbeResult>("/api/ech/probe", { host: h })),
      ]);
      saveHistory("ech", h, { basic: basicResult, probe: probeResult });
    } catch {
      // errors handled by useApi
    }
  };

  const loading = basicApi.loading || probeApi.loading;
  const probe = probeApi.data;

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("echDetection.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("echDetection.description")}</p>
      </div>

      {/* Client ECH support — always visible */}
      <ResultCard title={t("echDetection.clientSupport")} delay={0}>
        {!clientEch ? (
          <div className="text-sm text-gray-400">{t("echDetection.detecting")}</div>
        ) : (
          <div className="flex items-start gap-4">
            <StatusIcon status={clientEch.supported} className="text-xl shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-sm font-semibold text-gray-200">{clientEch.browser} {clientEch.version}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    clientEch.supported
                      ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      : "bg-red-500/20 text-red-400 border border-red-500/30"
                  }`}
                >
                  {clientEch.supported ? t("echDetection.clientSupported") : t("echDetection.clientNotSupported")}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-2">{clientEch.note}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <StatusIcon status={clientEch.secureContext} /> HTTPS
                </span>
                <span className="flex items-center gap-1">
                  <StatusIcon status={clientEch.tls13} /> TLS 1.3
                </span>
                <span className="flex items-center gap-1">
                  <StatusIcon status={clientEch.http2} /> HTTP/2
                </span>
              </div>
            </div>
          </div>
        )}
      </ResultCard>

      {/* Server check input */}
      <div className="card">
        <div className="flex gap-3">
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder={t("echDetection.placeholder")}
            className="input-field"
          />
          <button onClick={handleCheck} disabled={loading || !host.trim()} className="btn-primary whitespace-nowrap">
            {loading ? t("echDetection.buttonLoading") : t("echDetection.button")}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text={t("echDetection.loading")} />}

      {(basicApi.error || probeApi.error) && (
        <div className="card border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">{basicApi.error || probeApi.error}</p>
        </div>
      )}

      {probe && (
        <div className="space-y-4">
          {/* Probe grade overview */}
          <div className="card flex items-center gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <GradeBadge grade={probe.grade} size="lg" />
            <div>
              <div className="text-lg font-bold"><CopyableText copyText={`${probe.host}:${probe.port}`}>{probe.host}:{probe.port}</CopyableText></div>
              <div className="text-sm text-gray-400">
                {t("echDetection.serverEch")}:{" "}
                <span className={probe.echConfigPresent ? "text-emerald-400" : "text-red-400"}>
                  {probe.echConfigPresent ? t("common.supported") : t("common.notSupported")}
                </span>
              </div>
            </div>
          </div>

          {/* Probe detail cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <ResultCard title={t("echDetection.dnsHttps")} delay={0.15}>
              <div className="flex items-center gap-3">
                <StatusIcon status={probe.dnsHttpsRecord} className="text-xl" />
                <div className="text-sm font-medium">
                  {probe.dnsHttpsRecord ? t("common.found") : t("common.notFound")}
                </div>
              </div>
            </ResultCard>

            <ResultCard title={t("echDetection.echConfig")} delay={0.18}>
              <div className="flex items-center gap-3">
                <StatusIcon status={probe.echConfigPresent} className="text-xl" />
                <div className="text-sm font-medium">
                  {probe.echConfigPresent ? t("echDetection.echPublished") : t("common.notFound")}
                </div>
              </div>
            </ResultCard>

            <ResultCard title="TLS" delay={0.2}>
              <div className="space-y-1 text-sm">
                <div className="text-gray-200 font-mono">{probe.tlsVersion || "-"}</div>
                <div className="text-xs text-gray-500 truncate">{probe.cipherSuite || "-"}</div>
              </div>
            </ResultCard>
          </div>

          {/* Detailed probe results */}
          <ResultCard title={t("echDetection.probeDetails")} delay={0.25}>
            <div className="space-y-3">
              {probe.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3 py-2 border-b border-surface-3 last:border-0">
                  <StatusIcon
                    status={detail.status === "pass" ? true : detail.status === "fail" ? false : detail.status === "warn" ? "warn" : "info"}
                    className="mt-0.5 text-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CopyableText className="font-mono text-sm text-gray-200">{detail.check}</CopyableText>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        detail.status === "pass" ? "bg-emerald-500/20 text-emerald-400"
                          : detail.status === "fail" ? "bg-red-500/20 text-red-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {detail.status}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">{detail.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>

          {/* Combined verdict */}
          <ResultCard title={t("echDetection.verdict")} delay={0.3}>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-28 shrink-0">{t("echDetection.clientSide")}</span>
                {clientEch && <StatusIcon status={clientEch.supported} />}
                <span>{clientEch ? `${clientEch.browser} ${clientEch.version} — ${clientEch.supported ? t("echDetection.clientSupported") : t("echDetection.clientNotSupported")}` : "检测中..."}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-500 w-28 shrink-0">{t("echDetection.serverSide")}</span>
                <StatusIcon status={probe.echConfigPresent} />
                <span>{probe.host} — {probe.echConfigPresent ? t("common.supported") : t("common.notSupported")}</span>
              </div>
              <div className="mt-3 pt-3 border-t border-surface-3 text-xs text-gray-400">
                {clientEch && clientEch.supported && probe.echConfigPresent
                  ? t("echDetection.bothReady")
                  : clientEch && !clientEch.supported && probe.echConfigPresent
                  ? t("echDetection.serverOnly")
                  : clientEch && clientEch.supported && !probe.echConfigPresent
                  ? t("echDetection.clientOnly")
                  : t("echDetection.neitherReady")}
              </div>
            </div>
          </ResultCard>
        </div>
      )}
    </div>
  );
}
