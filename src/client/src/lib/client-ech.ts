export interface ClientEchInfo {
  browser: string;
  version: string;
  supported: boolean;
  tls13: boolean;
  secureContext: boolean;
  http2: boolean;
  note: string;
  details: string[];
}

// Synchronous UA-based detection (baseline)
function detectBrowser(): { name: string; version: number } {
  const ua = navigator.userAgent;

  const chromeMatch = ua.match(/(?:Chrome|Edg|OPR)\/(\d+)/);
  if (chromeMatch) {
    const ver = parseInt(chromeMatch[1], 10);
    const isEdge = /Edg\//.test(ua);
    const name = isEdge ? "Edge" : /OPR\//.test(ua) ? "Opera" : "Chrome";
    return { name, version: ver };
  }

  const firefoxMatch = ua.match(/Firefox\/(\d+)/);
  if (firefoxMatch) {
    return { name: "Firefox", version: parseInt(firefoxMatch[1], 10) };
  }

  const safariMatch = ua.match(/Version\/(\d+).*Safari/);
  if (safariMatch && !/Chrome|Chromium/.test(ua)) {
    return { name: "Safari", version: parseInt(safariMatch[1], 10) };
  }

  return { name: "Unknown", version: 0 };
}

// Check browser TLS/secure context capabilities
function checkCapabilities(): { secureContext: boolean; http2: boolean; cryptoSubtle: boolean } {
  const secureContext = window.isSecureContext;
  const cryptoSubtle = !!window.crypto?.subtle;

  // Detect HTTP/2 via performance API
  let http2 = false;
  try {
    const entries = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    http2 = entries.some((e) => (e as unknown as Record<string, string>).nextHopProtocol === "h2");
  } catch {}

  return { secureContext, http2, cryptoSubtle };
}

// Probe server for TLS metadata of this connection
async function probeServerTls(): Promise<{ tls13: boolean; alpn: string; serverTlsVersion?: string } | null> {
  try {
    const res = await fetch("/api/ech/client-probe", {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) return null;
    const data = await res.json() as { data?: { tlsVersion?: string; alpn?: string } };
    return {
      tls13: data.data?.tlsVersion?.includes("1.3") ?? false,
      alpn: data.data?.alpn ?? "unknown",
      serverTlsVersion: data.data?.tlsVersion,
    };
  } catch {
    return null;
  }
}

// Combined detection: UA + capabilities + server probe
export async function detectClientEch(): Promise<ClientEchInfo> {
  const browser = detectBrowser();
  const caps = checkCapabilities();
  const serverInfo = await probeServerTls();
  const details: string[] = [];

  // 1. UA-based version check
  let versionOk = false;
  if (browser.name === "Chrome" || browser.name === "Edge" || browser.name === "Opera") {
    versionOk = browser.version >= 105;
    details.push(`Browser: ${browser.name} ${browser.version} (ECH since v105)`);
  } else if (browser.name === "Firefox") {
    versionOk = browser.version >= 118;
    details.push(`Browser: Firefox ${browser.version} (ECH since v118)`);
  } else if (browser.name === "Safari") {
    versionOk = false;
    details.push(`Browser: Safari ${browser.version} (no ECH support yet)`);
  } else {
    details.push(`Browser: Unknown (cannot verify ECH support)`);
  }

  // 2. Secure context (HTTPS required for ECH)
  details.push(`Secure context: ${caps.secureContext ? "yes" : "no"} ${caps.secureContext ? "" : "(ECH requires HTTPS)"}`);

  // 3. HTTP/2 support (indicates modern TLS stack)
  details.push(`HTTP/2: ${caps.http2 ? "detected" : "not detected"}`);

  // 4. Server-reported TLS info (from Nginx headers in production)
  if (serverInfo) {
    details.push(`Server-observed TLS: ${serverInfo.serverTlsVersion || "unknown"}, ALPN: ${serverInfo.alpn}`);
  }

  // Final verdict: version check + secure context + (HTTP/2 or server TLS 1.3)
  // Note: localhost is treated as secure context by browsers, but ECH only works over real HTTPS
  const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1" || location.hostname === "::1";
  const hasModernTls = caps.http2 || (serverInfo?.tls13 ?? false);
  const supported = versionOk && caps.secureContext && hasModernTls && !isLocalhost;

  let note: string;
  if (isLocalhost) {
    note = `${browser.name} ${browser.version} supports ECH in theory, but running on localhost — ECH requires a real HTTPS server`;
  } else if (supported) {
    note = `${browser.name} ${browser.version} likely supports ECH — HTTPS + TLS 1.3 + modern browser confirmed`;
  } else if (!caps.secureContext) {
    note = "Page is not served over HTTPS — ECH requires a secure context";
  } else if (!versionOk) {
    note = `${browser.name} ${browser.version} is too old for ECH support`;
  } else {
    note = `${browser.name} ${browser.version}: TLS 1.3 not confirmed — ECH support uncertain`;
  }

  return {
    browser: browser.name,
    version: String(browser.version),
    supported,
    tls13: serverInfo?.tls13 ?? caps.http2,
    secureContext: caps.secureContext,
    http2: caps.http2,
    note,
    details,
  };
}
