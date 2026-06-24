import { reverse, getDnsServers } from "../utils/dns-resolver.js";
import type { DnsServerInfo, DnsLeakResult, DnsLeakDetail } from "../../shared/types.js";

async function resolvePtr(addr: string): Promise<string[]> {
  return Promise.race([
    reverse(addr),
    new Promise<string[]>((_, reject) => setTimeout(() => reject(new Error("PTR timeout")), 3_000)),
  ]);
}

interface DnsProviderInfo {
  name: string;
  type: "public" | "private" | "isp" | "unknown";
  encrypted: boolean;
}

const DNS_PROVIDER_MAP: Record<string, DnsProviderInfo> = {
  "8.8.8.8": { name: "Google Public DNS", type: "public", encrypted: false },
  "8.8.4.4": { name: "Google Public DNS", type: "public", encrypted: false },
  "2001:4860:4860::8888": { name: "Google Public DNS", type: "public", encrypted: false },
  "2001:4860:4860::8844": { name: "Google Public DNS", type: "public", encrypted: false },
  "1.1.1.1": { name: "Cloudflare DNS", type: "public", encrypted: false },
  "1.0.0.1": { name: "Cloudflare DNS", type: "public", encrypted: false },
  "2606:4700:4700::1111": { name: "Cloudflare DNS", type: "public", encrypted: false },
  "2606:4700:4700::1001": { name: "Cloudflare DNS", type: "public", encrypted: false },
  "9.9.9.9": { name: "Quad9", type: "public", encrypted: false },
  "149.112.112.112": { name: "Quad9", type: "public", encrypted: false },
  "2620:fe::fe": { name: "Quad9", type: "public", encrypted: false },
  "208.67.222.222": { name: "OpenDNS (Cisco)", type: "public", encrypted: false },
  "208.67.220.220": { name: "OpenDNS (Cisco)", type: "public", encrypted: false },
  "2620:119:35::35": { name: "OpenDNS (Cisco)", type: "public", encrypted: false },
  "64.6.64.6": { name: "Verisign Public DNS", type: "public", encrypted: false },
  "64.6.65.6": { name: "Verisign Public DNS", type: "public", encrypted: false },
  "8.26.56.26": { name: "Comodo Secure DNS", type: "public", encrypted: false },
  "8.20.247.20": { name: "Comodo Secure DNS", type: "public", encrypted: false },
  "94.140.14.14": { name: "AdGuard DNS", type: "public", encrypted: false },
  "94.140.15.15": { name: "AdGuard DNS", type: "public", encrypted: false },
  "76.76.2.0": { name: "Control D", type: "public", encrypted: false },
  "76.76.10.0": { name: "Control D", type: "public", encrypted: false },
  "77.88.8.8": { name: "Yandex DNS", type: "public", encrypted: false },
  "77.88.8.1": { name: "Yandex DNS", type: "public", encrypted: false },
  "185.228.168.9": { name: "CleanBrowsing", type: "public", encrypted: false },
  "185.228.169.9": { name: "CleanBrowsing", type: "public", encrypted: false },
};

const ISP_KEYWORDS = [
  "isp", "broadband", "cable", "dsl", "fiber", "telecom", "telephone",
  "telefonica", "comcast", "charter", "spectrum", "cox", "verizon",
  "att", "at&t", "bell", "rogers", "shaw", "telus", "optus", "telstra",
  "telia", "deutsche", "telekom", "bt ", "virgin", "orange", "sfr",
  "vodafone", "swisscom", "telenor", "teliasonera", "singtel",
  "kpn", "t-mobile", "sprint", "centurylink", "frontier", "windstream",
  "sky ", "fastweb", "wind tre", "tiscali", "free.fr", "free sas",
  "neuf", "numericable", "darty", "bouygues", "outremer",
];

const ENCRYPTED_DNS: Set<string> = new Set([
  "1.1.1.1", "1.0.0.1",
  "8.8.8.8", "8.8.4.4",
  "9.9.9.9", "149.112.112.112",
  "185.228.168.9", "185.228.169.9",
  "94.140.14.14", "94.140.15.15",
]);

function identifyServer(address: string, ptrHostname?: string): DnsServerInfo {
  const cleanAddr = address.replace(/^\[|\]$/g, "");
  const known = DNS_PROVIDER_MAP[cleanAddr];
  if (known) {
    return {
      address: cleanAddr,
      provider: known.name,
      type: known.type,
      isEncrypted: ENCRYPTED_DNS.has(cleanAddr),
      isLeakLikely: false,
    };
  }
  const hostname = ptrHostname || "";
  const hostLower = hostname.toLowerCase();
  const isIspLike = ISP_KEYWORDS.some((kw) => hostLower.includes(kw.replace(/[^a-z0-9]/g, "").replace(/&/g, "")));
  if (isIspLike || hostLower.includes("resolver") || hostLower.includes("dns") || hostLower.includes("cache")) {
    return {
      address: cleanAddr,
      provider: hostname || "ISP DNS",
      type: "isp",
      isEncrypted: false,
      isLeakLikely: true,
    };
  }
  if (cleanAddr.startsWith("127.") || cleanAddr === "::1" || cleanAddr.startsWith("192.168.") ||
      cleanAddr.startsWith("10.") || cleanAddr.startsWith("172.16.")) {
    return {
      address: cleanAddr,
      provider: "Local/Private DNS",
      type: "private",
      isEncrypted: false,
      isLeakLikely: false,
    };
  }
  return {
    address: cleanAddr,
    provider: hostname || "Unknown DNS",
    type: "unknown",
    isEncrypted: false,
    isLeakLikely: true,
  };
}

export async function detectDnsServers(): Promise<DnsServerInfo[]> {
  let systemServers: string[];
  try {
    systemServers = getDnsServers();
  } catch {
    return [];
  }
  const results: DnsServerInfo[] = [];
  for (const addr of systemServers) {
    const clean = addr.replace(/^\[|\]$/g, "").replace(/%\d+$/, "");
    // Skip IPv6 link-local / site-local that can't be reverse-resolved
    if (clean.includes(":") && (clean.startsWith("fe80") || clean.startsWith("fec0") || clean.startsWith("fc") || clean.startsWith("fd"))) {
      results.push(identifyServer(addr));
      continue;
    }
    let ptrHostname: string | undefined;
    try {
      const hostnames = await resolvePtr(clean);
      ptrHostname = hostnames[0];
    } catch {}
    results.push(identifyServer(addr, ptrHostname));
  }
  return results;
}

function determineGrade(servers: DnsServerInfo[]): { grade: DnsLeakResult["grade"]; leakDetected: boolean } {
  if (servers.length === 0) return { grade: "F", leakDetected: true };
  const hasPublic = servers.some((s) => s.type === "public");
  const hasIsp = servers.some((s) => s.type === "isp");
  const hasUnknown = servers.some((s) => s.type === "unknown");
  const allEncrypted = servers.every((s) => s.isEncrypted);
  if (allEncrypted && hasPublic && !hasIsp) return { grade: "A+", leakDetected: false };
  if (hasPublic && !hasIsp && !hasUnknown) return { grade: "A", leakDetected: false };
  if (hasPublic && hasIsp) return { grade: "B", leakDetected: true };
  if (hasIsp && !hasPublic) return { grade: "C", leakDetected: true };
  if (hasUnknown) return { grade: "D", leakDetected: true };
  return { grade: "F", leakDetected: true };
}

export async function checkDnsLeak(): Promise<DnsLeakResult> {
  const servers = await detectDnsServers();
  const { grade, leakDetected } = determineGrade(servers);
  const details: DnsLeakDetail[] = [];
  details.push({
    check: "DNS Server Detection",
    status: servers.length > 0 ? "pass" : "fail",
    message: servers.length > 0
      ? `Detected ${servers.length} DNS server${servers.length > 1 ? "s" : ""}`
      : "No DNS servers detected on this system",
  });
  const publicServers = servers.filter((s) => s.type === "public");
  if (publicServers.length > 0) {
    details.push({
      check: "Public DNS Usage",
      status: "pass",
      message: `Using ${publicServers.length} known public DNS provider${publicServers.length > 1 ? "s" : ""}: ${publicServers.map((s) => s.provider).join(", ")}`,
    });
  }
  const ispServers = servers.filter((s) => s.type === "isp");
  if (ispServers.length > 0) {
    details.push({
      check: "ISP DNS Detected",
      status: "warn",
      message: `${ispServers.length} ISP-owned DNS server${ispServers.length > 1 ? "s" : ""} detected: ${ispServers.map((s) => s.provider).join(", ")}${leakDetected ? " — VPN/tunnel DNS queries may be leaking" : ""}`,
    });
  }
  const unknownServers = servers.filter((s) => s.type === "unknown");
  if (unknownServers.length > 0) {
    details.push({
      check: "Unknown DNS Resolvers",
      status: "warn",
      message: `${unknownServers.length} unknown DNS server${unknownServers.length > 1 ? "s" : ""} detected: ${unknownServers.map((s) => s.provider).join(", ")}`,
    });
  }
  if (leakDetected) {
    details.push({
      check: "DNS Leak Status",
      status: "fail",
      message: "DNS leak detected! Some DNS queries may be exposed outside your VPN/tunnel.",
    });
  } else {
    details.push({
      check: "DNS Leak Status",
      status: "pass",
      message: "No DNS leaks detected. DNS configuration looks privacy-conscious.",
    });
  }
  return { detectedServers: servers, leakDetected, grade, details };
}
