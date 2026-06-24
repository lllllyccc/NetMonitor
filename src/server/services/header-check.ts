import { lookupAll } from "../utils/dns-resolver.js";
import type { HttpHeadersResult, HttpHeaderCheck } from "../../shared/types.js";

interface HeaderRule {
  name: string;
  severity: "critical" | "important" | "recommended";
  recommendation: string;
  validate?: (value: string) => boolean;
}

// Block requests to private/reserved IPs (SSRF protection)
// Returns resolved IP if allowed, null if blocked
async function resolveAndValidateIp(hostname: string): Promise<string | null> {
  const lower = hostname.toLowerCase().replace(/^\[|\]$/g, "");

  // Direct IPv4 check
  const ipv4Match = lower.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (ipv4Match) {
    const [, a, b] = ipv4Match.map(Number);
    if (a === 10 || a === 127 || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
        a === 0 || a >= 224) return null;
    return lower;
  }

  // Block localhost
  if (lower === "localhost" || lower === "::1") return null;

  // Resolve hostname and check resolved IPs
  const addresses = await lookupAll(lower);
  for (const addr of addresses) {
    const ip = addr.address;
    if (ip === "127.0.0.1" || ip === "::1") return null;
    const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if (m) {
      const [, a, b] = m.map(Number);
      if (a === 10 || a === 127 || (a === 169 && b === 254) ||
          (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
          a === 0 || a >= 224) return null;
    }
  }

  return addresses.length > 0 ? addresses[0].address : null;
}

const RULES: HeaderRule[] = [
  {
    name: "strict-transport-security",
    severity: "critical",
    recommendation: "Add HSTS with max-age=31536000; includeSubDomains",
    validate: (v) => /max-age=\d+/.test(v) && parseInt(v.match(/max-age=(\d+)/)?.[1] || "0") >= 31536000,
  },
  {
    name: "content-security-policy",
    severity: "critical",
    recommendation: "Define a Content-Security-Policy to prevent XSS and injection attacks",
  },
  {
    name: "x-frame-options",
    severity: "important",
    recommendation: "Set X-Frame-Options to DENY or SAMEORIGIN",
    validate: (v) => ["deny", "sameorigin"].includes(v.toLowerCase()),
  },
  {
    name: "x-content-type-options",
    severity: "important",
    recommendation: "Set X-Content-Type-Options to nosniff",
    validate: (v) => v.toLowerCase() === "nosniff",
  },
  {
    name: "referrer-policy",
    severity: "recommended",
    recommendation: "Set Referrer-Policy to strict-origin-when-cross-origin or no-referrer",
  },
  {
    name: "permissions-policy",
    severity: "recommended",
    recommendation: "Define a Permissions-Policy to restrict browser features",
  },
  {
    name: "x-xss-protection",
    severity: "recommended",
    recommendation: "Set X-XSS-Protection to 0 (prefer CSP over this deprecated header)",
    validate: (v) => v === "0",
  },
];

export async function checkHeaders(url: string): Promise<HttpHeadersResult> {
  const targetUrl = url.startsWith("http") ? url : `https://${url}`;
  const urlObj = new URL(targetUrl);

  const resolvedIp = await resolveAndValidateIp(urlObj.hostname);
  if (!resolvedIp) {
    throw new Error("URL targets a private or reserved address and is not allowed");
  }

  const ac = new AbortController();
  const timeout = setTimeout(() => ac.abort(), 10_000);
  const response = await fetch(urlObj.href, {
    method: "GET",
    redirect: "follow",
    signal: ac.signal,
    headers: { "User-Agent": "NetMonitor/1.0 Security-Checker" },
  });
  await response.body?.cancel().catch(() => {});
  clearTimeout(timeout);

  const headers: HttpHeaderCheck[] = RULES.map((rule) => {
    const value = response.headers.get(rule.name);
    const present = value !== null;
    const valid = present && rule.validate ? rule.validate(value) : present;

    return {
      name: rule.name,
      present,
      value: value || undefined,
      recommendation: !present || !valid ? rule.recommendation : undefined,
      severity: rule.severity,
    };
  });

  // Calculate score: critical=20pts, important=15pts, recommended=10pts
  const maxScore = RULES.reduce((sum, r) => {
    return sum + (r.severity === "critical" ? 20 : r.severity === "important" ? 15 : 10);
  }, 0);

  const actualScore = headers.reduce((sum, h) => {
    if (h.present && !h.recommendation) {
      const rule = RULES.find((r) => r.name === h.name)!;
      return sum + (rule.severity === "critical" ? 20 : rule.severity === "important" ? 15 : 10);
    }
    return sum;
  }, 0);

  const percentage = Math.round((actualScore / maxScore) * 100);

  let grade: HttpHeadersResult["grade"];
  if (percentage >= 95) grade = "A+";
  else if (percentage >= 85) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 50) grade = "C";
  else if (percentage >= 30) grade = "D";
  else grade = "F";

  return {
    url: targetUrl,
    statusCode: response.status,
    headers,
    score: percentage,
    grade,
  };
}
