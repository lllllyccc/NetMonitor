import { useState } from "react";
import { apiGet } from "../lib/api";
import { saveHistory } from "../lib/history";
import { useApi } from "../hooks/useApi";
import { ResultCard } from "../components/ResultCard";
import { CopyableText } from "../components/CopyableText";
import { StatusIcon } from "../components/StatusIcon";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useLocale } from "../hooks/useLocale";
import type { IpLookupResult } from "@shared/types";

function countryFlag(code: string): string {
  if (!code || code.length !== 2) return "";
  const base = 0x1f1e6 - 65; // regional indicator 'A' offset
  const a = code.charCodeAt(0);
  const b = code.charCodeAt(1);
  return String.fromCodePoint(base + a, base + b);
}

export function IpLookupPage() {
  const [target, setTarget] = useState("");
  const { data, loading, error, execute } = useApi<IpLookupResult>();
  const { t } = useLocale();

  const handleLookup = async () => {
    try {
      const result = await execute(() => apiGet<IpLookupResult>("/api/ip/lookup", { target }));
      saveHistory("ip", result.ip, result);
    } catch {
      // error already handled by useApi
    }
  };

  return (
    <div className="space-y-6 page-enter">
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-accent to-violet-bright bg-clip-text text-transparent">{t("ipLookup.title")}</h2>
        <p className="text-sm text-gray-500 mt-1">{t("ipLookup.description")}</p>
      </div>

      <div className="card">
        <div className="flex gap-3">
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLookup()}
            placeholder={t("ipLookup.placeholder")}
            className="input-field"
          />
          <button onClick={handleLookup} disabled={loading} className="btn-primary whitespace-nowrap">
            {loading ? t("ipLookup.buttonLoading") : t("ipLookup.button")}
          </button>
        </div>
      </div>

      {loading && <LoadingSpinner text={t("ipLookup.loading")} />}

      {error && (
        <div className="card border-danger/30 bg-danger/5">
          <p className="text-danger text-sm">{error}</p>
        </div>
      )}

      {data && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* IP addresses */}
          <ResultCard title={t("ipLookup.cardIp")} delay={0.1}>
            <div className="space-y-3">
              <div>
                <span className="text-xs text-gray-500 uppercase">IPv4</span>
                <div className="text-2xl font-bold text-accent font-mono"><CopyableText>{data.ip}</CopyableText></div>
              </div>
              {data.ipv6 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase">IPv6</span>
                  <div className="text-lg font-semibold text-violet-bright font-mono break-all"><CopyableText>{data.ipv6}</CopyableText></div>
                </div>
              )}
              {!data.ipv6 && (
                <div>
                  <span className="text-xs text-gray-500 uppercase">IPv6</span>
                  <div className="text-sm text-gray-600">Not detected</div>
                </div>
              )}
              {data.reverseDns && (
                <div>
                  <span className="text-xs text-gray-500 uppercase">{t("ipLookup.ptr")}</span>
                  <div className="text-sm text-gray-400 font-mono"><CopyableText>{data.reverseDns}</CopyableText></div>
                </div>
              )}
            </div>
          </ResultCard>

          {/* Location with flag */}
          <ResultCard title={t("ipLookup.cardLocation")} delay={0.15}>
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{countryFlag(data.countryCode)}</span>
                <div>
                  <div className="text-lg font-semibold"><CopyableText copyText={`${data.city}, ${data.region}`}>{data.city}, {data.region}</CopyableText></div>
                  <div className="text-gray-400"><CopyableText>{data.country}</CopyableText></div>
                </div>
              </div>
              <div className="text-xs text-gray-500 mt-2">
                <CopyableText copyText={`${data.lat.toFixed(4)}, ${data.lon.toFixed(4)}`}>{data.lat.toFixed(4)}, {data.lon.toFixed(4)}</CopyableText>
              </div>
            </div>
          </ResultCard>

          <ResultCard title={t("ipLookup.cardNetwork")} delay={0.2}>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500 uppercase">{t("ipLookup.isp")}</span>
                <div className="text-sm"><CopyableText>{data.isp}</CopyableText></div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">{t("ipLookup.organization")}</span>
                <div className="text-sm"><CopyableText>{data.org}</CopyableText></div>
              </div>
              <div>
                <span className="text-xs text-gray-500 uppercase">{t("ipLookup.asn")}</span>
                <div className="text-sm font-mono"><CopyableText>{data.asn}</CopyableText></div>
              </div>
            </div>
          </ResultCard>

          <ResultCard title={t("ipLookup.cardSecurity")} delay={0.25}>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <StatusIcon status={!data.isProxy} />
                <span className="text-sm">{data.isProxy ? t("ipLookup.proxyDetected") : t("ipLookup.noProxy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status={!data.isVpn} />
                <span className="text-sm">{data.isVpn ? t("ipLookup.vpnDetected") : t("ipLookup.noVpn")}</span>
              </div>
              <div className="flex items-center gap-2">
                <StatusIcon status={!data.isTor} />
                <span className="text-sm">{data.isTor ? t("ipLookup.torNode") : t("ipLookup.notTor")}</span>
              </div>
            </div>
          </ResultCard>
        </div>
      )}
    </div>
  );
}
