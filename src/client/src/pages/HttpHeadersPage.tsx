import { useState } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { useApi } from "../hooks/useApi";
import { ResultCard } from "../components/ResultCard";
import { CopyableText } from "../components/CopyableText";
import { GradeBadge } from "../components/GradeBadge";
import { StatusIcon } from "../components/StatusIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import type { HttpHeadersResult } from "@shared/types";

export function HttpHeadersPage() {
  const [url, setUrl] = useState("");
  const { data, loading, error, execute } = useApi<HttpHeadersResult>();
  const { t } = useLocale();

  const handleCheck = async () => {
    if (!url.trim()) return;
    try {
      const result = await execute(() => apiGet<HttpHeadersResult>("/api/headers/check", { url: url.trim() }));
      saveHistory("headers", url.trim(), result);
    } catch {
      // error already handled by useApi
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("httpHeaders.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("httpHeaders.description")}</p>
      </div>

      <div className="card">
        <div className="flex gap-3">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCheck()}
            placeholder={t("httpHeaders.placeholder")}
            className="input-field"
          />
          <button onClick={handleCheck} disabled={loading || !url.trim()} className="btn-primary whitespace-nowrap">
            {loading ? t("httpHeaders.buttonLoading") : t("httpHeaders.button")}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text={t("httpHeaders.loading")} />}

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
              <div className="text-lg font-bold"><CopyableText>{data.url}</CopyableText></div>
              <div className="text-sm text-gray-400">{t("httpHeaders.status")}: {data.statusCode}</div>
              <div className="text-sm text-gray-400">{t("httpHeaders.score")}: {data.score}%</div>
            </div>
          </div>

          {/* Headers table */}
          <ResultCard title={t("httpHeaders.analysis")} delay={0.15}>
            <div className="space-y-3">
              {data.headers.map((header) => (
                <div
                  key={header.name}
                  className="flex items-start gap-3 py-2 border-b border-surface-3 last:border-0"
                >
                  <StatusIcon
                    status={header.present && !header.recommendation ? true : header.present ? "warn" : false}
                    className="mt-0.5 text-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <CopyableText className="font-mono text-sm text-gray-200">{header.name}</CopyableText>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded ${
                          header.severity === "critical"
                            ? "bg-danger/20 text-danger"
                            : header.severity === "important"
                            ? "bg-warn/20 text-warn"
                            : "bg-info/20 text-info"
                        }`}
                      >
                        {header.severity}
                      </span>
                    </div>
                    {header.value && (
                      <div className="text-xs text-gray-500 font-mono mt-1 truncate">
                        <CopyableText>{header.value}</CopyableText>
                      </div>
                    )}
                    {header.recommendation && (
                      <div className="text-xs text-gray-400 mt-1">
                        {header.recommendation}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ResultCard>
        </div>
      )}
    </div>
  );
}
