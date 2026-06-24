import { resolve4, resolve6, reverse } from "../utils/dns-resolver.js";
import type { IpLookupResult } from "../../shared/types.js";

const IPAPI_URL = "http://ip-api.com/json/";
const IPINFO_URL = "https://ipinfo.io/";

interface IpApiResponse {
  status: string;
  query: string;
  country: string;
  countryCode: string;
  city: string;
  regionName: string;
  lat: number;
  lon: number;
  isp: string;
  org: string;
  as: string;
  proxy?: boolean;
}

interface IpinfoResponse {
  ip: string;
  hostname?: string;
  city?: string;
  region?: string;
  country?: string;
  org?: string;
  loc?: string;
}

async function fetchPublicIPv6(): Promise<string | undefined> {
  try {
    const res = await fetch("https://api64.ipify.org?format=json", {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return undefined;
    const data = await res.json() as { ip?: string };
    // ipify may return IPv4 if no IPv6 is available
    if (data.ip && data.ip.includes(":")) return data.ip;
    return undefined;
  } catch {
    return undefined;
  }
}

export async function lookupIp(target?: string): Promise<IpLookupResult> {
  let resolvedIp = "";
  const queryTarget = target ? target.trim() : "";
  const ipinfoToken = process.env.IPINFO_TOKEN || "";

  // If a target is given, resolve hostname to IP first
  if (queryTarget) {
    // Check if it's already an IP address
    const isIp = /^[\d.:a-fA-F]+$/.test(queryTarget);
    if (isIp) {
      resolvedIp = queryTarget;
    } else {
      // Resolve hostname to IP via DNS
      try {
        const addresses = await resolve4(queryTarget);
        resolvedIp = addresses[0];
      } catch {
        try {
          const addresses = await resolve6(queryTarget);
          resolvedIp = addresses[0];
        } catch {
          throw new Error(`DNS resolution failed for: ${queryTarget}`);
        }
      }
    }
  }

  const apiUrl = resolvedIp ? `${IPAPI_URL}${resolvedIp}` : `${IPAPI_URL}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  // Fetch IPv4 geo + IPv6 in parallel
  const [apiRes, infoRes, ipv6Res] = await Promise.allSettled([
    fetch(apiUrl, { signal: controller.signal }).then((r) => r.json() as Promise<IpApiResponse>),
    fetch(`${IPINFO_URL}${resolvedIp || ""}?token=${ipinfoToken}`, { signal: controller.signal }).then((r) =>
      r.ok ? (r.json() as Promise<IpinfoResponse>) : null
    ).catch(() => null),
    !resolvedIp ? fetchPublicIPv6() : Promise.resolve(null),
  ]);
  clearTimeout(timeout);

  const apiData = apiRes.status === "fulfilled" ? apiRes.value : null;
  const ipv6 = ipv6Res.status === "fulfilled" ? ipv6Res.value : undefined;

  if (!apiData || apiData.status === "fail") {
    throw new Error(`IP lookup failed for: ${queryTarget || "auto"}`);
  }

  // Reverse DNS lookup
  let reverseDns: string | undefined;
  try {
    const hostnames = await reverse(apiData.query);
    reverseDns = hostnames[0];
  } catch {
    // PTR record may not exist
  }

  // Detect VPN/Proxy/Tor by ASN keywords
  const asnLower = (apiData.as || "").toLowerCase();
  const orgLower = (apiData.org || "").toLowerCase();
  const proxyKeywords = ["vpn", "proxy", "tor", "cloud", "hosting", "datacenter", "data center"];
  const isSuspect = proxyKeywords.some(
    (kw) => asnLower.includes(kw) || orgLower.includes(kw)
  );

  return {
    ip: apiData.query,
    ipv6: ipv6 || undefined,
    countryCode: apiData.countryCode || "",
    country: apiData.country,
    city: apiData.city,
    region: apiData.regionName,
    lat: apiData.lat,
    lon: apiData.lon,
    isp: apiData.isp,
    org: apiData.org,
    asn: apiData.as,
    isProxy: apiData.proxy || (isSuspect && orgLower.includes("proxy")),
    isVpn: isSuspect && (orgLower.includes("vpn") || asnLower.includes("vpn")),
    isTor: isSuspect && (orgLower.includes("tor") || asnLower.includes("tor")),
    reverseDns,
  };
}
