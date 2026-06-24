import tls from "node:tls";
import type { EchCheckResult, EchDetail } from "../../shared/types.js";

interface DnsAnswer {
  name: string;
  type: number;
  data: string;
}

// Check DNS HTTPS record via DoH (Cloudflare)
async function checkDnsHttpsRecord(host: string): Promise<{ found: boolean; value?: string; echConfig?: string }> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${host}&type=HTTPS`;
    const res = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(5_000),
    });
    const data = await res.json() as { Answer?: DnsAnswer[] };
    const answers = data.Answer?.filter((a) => a.type === 65) ?? [];
    if (answers.length === 0) return { found: false, echConfig: undefined };
    const value = answers[0].data;
    const match = value.match(/ech="([A-Za-z0-9+/=]+)"/);
    return { found: true, value, echConfig: match ? match[1] : undefined };
  } catch {
    return { found: false, echConfig: undefined };
  }
}

// Check TLS ECH support (simplified: Node.js doesn't expose raw ECH extensions)
async function checkTlsEch(host: string, port: number): Promise<{ detected: boolean }> {
  return new Promise((resolve) => {
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
        ALPNProtocols: ["h2", "http/1.1"],
      },
      () => {
        socket.destroy();
        // Conservative: cannot confirm ECH without raw ServerHello extension parsing
        resolve({ detected: false });
      }
    );
    socket.on("error", () => resolve({ detected: false }));
    socket.setTimeout(5_000, () => {
      socket.destroy();
      resolve({ detected: false });
    });
  });
}

export async function checkEch(host: string, port = 443): Promise<EchCheckResult> {
  const details: EchDetail[] = [];
  let dnsHttpsRecord = false;
  let dnsHttpsValue: string | undefined;
  let tlsEchDetected = false;
  let echConfig: string | undefined;

  // Step 1: Check DNS HTTPS record
  const dnsResult = await checkDnsHttpsRecord(host);
  dnsHttpsRecord = dnsResult.found;
  dnsHttpsValue = dnsResult.value;
  echConfig = dnsResult.echConfig;

  if (dnsResult.found) {
    details.push({
      check: "DNS HTTPS Record",
      status: "pass",
      message: `HTTPS record found: ${dnsResult.value?.substring(0, 120)}${(dnsResult.value?.length ?? 0) > 120 ? "..." : ""}`,
    });
  } else {
    details.push({
      check: "DNS HTTPS Record",
      status: "fail",
      message: "No DNS HTTPS/SVCB record found for this host",
    });
  }

  // Step 2: ECH config already extracted from DNS HTTPS record above
  if (echConfig) {
    details.push({
      check: "ECH Config",
      status: "pass",
      message: "ECH configuration published in DNS HTTPS record",
    });
  } else if (dnsResult.found) {
    details.push({
      check: "ECH Config",
      status: "warn",
      message: "HTTPS record exists but no ech= parameter found",
    });
  } else {
    details.push({
      check: "ECH Config",
      status: "fail",
      message: "No ECH configuration found in DNS",
    });
  }

  // Step 3: TLS-level ECH detection
  const tlsResult = await checkTlsEch(host, port);
  tlsEchDetected = tlsResult.detected;

  if (tlsEchDetected) {
    details.push({
      check: "TLS ECH Extension",
      status: "pass",
      message: "ECH extension detected in TLS handshake",
    });
  } else {
    details.push({
      check: "TLS ECH Extension",
      status: "info",
      message: "ECH extension not detected (may require client-side ECH support to negotiate)",
    });
  }

  // Step 4: Check TLS 1.3 requirement
  try {
    const tlsCheck = await new Promise<boolean>((resolve) => {
      const socket = tls.connect({ host, port, servername: host, rejectUnauthorized: false }, () => {
        const proto = socket.getProtocol();
        socket.destroy();
        resolve(proto?.includes("TLSv1.3") ?? false);
      });
      socket.on("error", () => resolve(false));
      socket.setTimeout(5_000, () => { socket.destroy(); resolve(false); });
    });

    if (tlsCheck) {
      details.push({
        check: "TLS 1.3 Support",
        status: "pass",
        message: "Server supports TLS 1.3 (required for ECH)",
      });
    } else {
      details.push({
        check: "TLS 1.3 Support",
        status: "fail",
        message: "Server does not support TLS 1.3 — ECH requires TLS 1.3",
      });
    }
  } catch {
    details.push({
      check: "TLS 1.3 Support",
      status: "fail",
      message: "Could not verify TLS version",
    });
  }

  // Calculate overall ECH support
  const echSupported = echConfig !== undefined || tlsEchDetected;

  // Grade
  let grade: EchCheckResult["grade"];
  if (echSupported && echConfig) grade = "A+";
  else if (echSupported) grade = "A";
  else if (dnsHttpsRecord) grade = "C";
  else grade = "F";

  return {
    host,
    echSupported,
    echConfig,
    dnsHttpsRecord,
    dnsHttpsValue,
    tlsEchDetected,
    grade,
    details,
  };
}
