import { useEffect, useState } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { useApi } from "../hooks/useApi";
import { ResultCard } from "../components/ResultCard";
import { CopyableText } from "../components/CopyableText";
import { StatusIcon } from "../components/StatusIcon";
import { GradeBadge } from "../components/GradeBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import type { DnsLeakResult, DnsServerInfo } from "@shared/types";

const TYPE_COLORS: Record<DnsServerInfo["type"], string> = {
  public: "text-emerald-400",
  isp: "text-yellow-400",
  private: "text-gray-400",
  unknown: "text-red-400",
};

export function DnsLeakPage() {
  const [autoRun, setAutoRun] = useState(true);
  const { data, loading, error, execute } = useApi<DnsLeakResult>();
  const { t } = useLocale();

  const runTest = async () => {
    try {
      const result = await execute(() => apiGet<DnsLeakResult>("/api/dns/leak-test"));
      saveHistory("dns", "system", result);
    } catch {
      // error already handled by useApi
    }
  };

  useEffect(() => {
    if (autoRun) {
      runTest();
      setAutoRun(false);
    }
  }, [autoRun]);

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("dnsLeak.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("dnsLeak.description")}</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-3">
          <button onClick={runTest} disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? t("dnsLeak.buttonLoading") : t("dnsLeak.button")}
          </button>
          <span className="text-xs text-gray-500">
            {t("dnsLeak.scope")}: {t("dnsLeak.thisServer")}
          </span>
        </div>
      </div>

      {loading && <LoadingSpinner text={t("dnsLeak.loading")} />}

      {error && (
        <div className="card border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {data && (
        <>
          {/* Grade + Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <ResultCard title={t("dnsLeak.grade")} delay={0.1}>
              <div className="flex items-center gap-4">
                <GradeBadge grade={data.grade} size="lg" />
                <div>
                  <div className={`text-lg font-semibold ${data.leakDetected ? "text-danger" : "text-emerald-400"}`}>
                    {data.leakDetected ? t("dnsLeak.leakDetected") : t("dnsLeak.noLeak")}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {data.detectedServers.length} DNS server{data.detectedServers.length > 1 ? "s" : ""} configured
                  </div>
                </div>
              </div>
            </ResultCard>

            <ResultCard title={t("dnsLeak.serverInfo")} delay={0.15}>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("dnsLeak.detectionTime")}</span>
                  <span className="font-mono text-xs">{new Date().toLocaleTimeString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">{t("dnsLeak.scope")}</span>
                  <span>{t("dnsLeak.thisServer")}</span>
                </div>
              </div>
            </ResultCard>
          </div>

          {/* DNS Servers Table */}
          <ResultCard title={t("dnsLeak.detectedServers")} delay={0.2}>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase border-b border-surface-3">
                    <th className="text-left py-2 pr-4">{t("dnsLeak.address")}</th>
                    <th className="text-left py-2 pr-4">{t("dnsLeak.provider")}</th>
                    <th className="text-left py-2 pr-4">{t("dnsLeak.type")}</th>
                    <th className="text-left py-2 pr-4">{t("dnsLeak.encrypted")}</th>
                    <th className="text-right py-2">{t("dnsLeak.leakRisk")}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.detectedServers.map((server, i) => (
                    <tr key={i} className="border-b border-surface-3 last:border-0">
                      <td className="py-3 pr-4 font-mono text-xs"><CopyableText>{server.address}</CopyableText></td>
                      <td className="py-3 pr-4"><CopyableText>{server.provider}</CopyableText></td>
                      <td className={`py-3 pr-4 text-xs font-medium ${TYPE_COLORS[server.type]}`}>
                        {server.type === "public" ? t("dnsLeak.typePublic") :
                         server.type === "isp" ? t("dnsLeak.typeIsp") :
                         server.type === "private" ? t("dnsLeak.typePrivate") :
                         t("dnsLeak.typeUnknown")}
                      </td>
                      <td className="py-3 pr-4">
                        <StatusIcon status={server.isEncrypted} />
                      </td>
                      <td className="py-3 text-right">
                        <StatusIcon status={!server.isLeakLikely} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ResultCard>

          {/* Details */}
          <ResultCard title={t("dnsLeak.checkDetails")} delay={0.25}>
            <div className="space-y-3">
              {data.details.map((detail, i) => (
                <div key={i} className="flex items-start gap-3">
                  <StatusIcon
                    status={detail.status === "pass" ? true : detail.status === "fail" ? false : detail.status}
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-200">{detail.check}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{detail.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>
        </>
      )}
    </div>
  );
}
