import { useState } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { useApi } from "../hooks/useApi";
import { ResultCard } from "../components/ResultCard";
import { CopyableText } from "../components/CopyableText";
import { GradeBadge } from "../components/GradeBadge";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import type { TlsCheckResult } from "@shared/types";

export function TlsCheckPage() {
  const [host, setHost] = useState("");
  const { data, loading, error, execute } = useApi<TlsCheckResult>();
  const { t } = useLocale();

  const handleCheck = async () => {
    if (!host.trim()) return;
    try {
      const result = await execute(() => apiGet<TlsCheckResult>("/api/tls/check", { host: host.trim() }));
      saveHistory("tls", host.trim(), result);
    } catch {
      // error already handled by useApi
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("tlsCheck.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("tlsCheck.description")}</p>
      </div>

      <div className="card">
        <div className="flex gap-3">
          <input
            type="text"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder={t("tlsCheck.placeholder")}
            className="input-field"
          />
          <button onClick={handleCheck} disabled={loading || !host.trim()} className="btn-primary whitespace-nowrap">
            {loading ? t("tlsCheck.buttonLoading") : t("tlsCheck.button")}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text={t("tlsCheck.loading")} />}

      {error && (
        <div className="card border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {data && (
        <div className="space-y-4">
          {/* Grade overview */}
          <div className="card flex items-center gap-6 animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <GradeBadge grade={data.grade} size="lg" />
            <div>
              <div className="text-lg font-bold"><CopyableText copyText={`${data.host}:${data.port}`}>{data.host}:{data.port}</CopyableText></div>
              <div className="text-sm text-gray-400">{t("tlsCheck.protocol")}: <CopyableText>{data.protocol}</CopyableText></div>
              <div className="text-sm text-gray-400">{t("tlsCheck.cipher")}: <CopyableText>{data.cipher}</CopyableText></div>
            </div>
          </div>

          {/* Issues */}
          {data.issues.length > 0 && (
          <div className="card border-warn/30 bg-warn/5 animate-fade-in-up" style={{ animationDelay: "0.15s", opacity: 0 }}>
              <h3 className="text-sm font-semibold text-warn mb-2">{t("tlsCheck.issuesFound")}</h3>
              <ul className="space-y-1">
                {data.issues.map((issue, i) => (
                  <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                    <span className="text-warn mt-0.5">!</span> {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
          <ResultCard title={t("tlsCheck.certificate")} delay={0.2}>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">{t("tlsCheck.subject")}:</span>{" "}
                <CopyableText className="font-mono">{data.certificate.subject}</CopyableText>
              </div>
              <div>
                <span className="text-gray-500">{t("tlsCheck.issuer")}:</span>{" "}
                <CopyableText>{data.certificate.issuer}</CopyableText>
              </div>
              <div>
                <span className="text-gray-500">{t("tlsCheck.valid")}:</span>{" "}
                <span>
                  {new Date(data.certificate.validFrom).toLocaleDateString()} -{" "}
                  {new Date(data.certificate.validTo).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">{t("tlsCheck.daysRemaining")}:</span>{" "}
                <span
                  className={
                    data.certificate.daysRemaining < 30
                      ? "text-warn font-semibold"
                      : "text-accent"
                  }
                >
                  {data.certificate.daysRemaining}
                </span>
              </div>
            </div>
          </ResultCard>

          <ResultCard title={t("tlsCheck.details")} delay={0.25}>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">{t("tlsCheck.serial")}:</span>{" "}
                <CopyableText className="font-mono text-xs break-all">{data.certificate.serialNumber}</CopyableText>
              </div>
              <div>
                <span className="text-gray-500">{t("tlsCheck.fingerprint")}:</span>{" "}
                <CopyableText className="font-mono text-xs break-all">{data.certificate.fingerprint}</CopyableText>
              </div>
              <div>
                <span className="text-gray-500">{t("tlsCheck.ocspStapling")}:</span>{" "}
                <span className={data.ocspStapling ? "text-accent" : "text-gray-400"}>
                  {data.ocspStapling ? t("common.enabled") : t("common.ocspNotFound")}
                </span>
              </div>
            </div>
          </ResultCard>
          </div>
        </div>
      )}
    </div>
  );
}
