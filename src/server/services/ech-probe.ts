import tls from "node:tls";
import dns from "node:dns";

export interface EchProbeResult {
  host: string;
  port: number;
  dnsHttpsRecord: boolean;
  echConfigPresent: boolean;
  echConfigPayload?: string;
  tlsVersion?: string;
  cipherSuite?: string;
  alpnProtocols?: string[];
  certificateMatch: boolean;
  serverNameIndication: boolean;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  details: Array<{ check: string; status: "pass" | "fail" | "info" | "warn"; message: string }>;
}

// Fetch DNS HTTPS records via Cloudflare DoH
async function fetchDnsHttps(host: string): Promise<{ found: boolean; records: string[]; echParam?: string }> {
  try {
    const url = `https://cloudflare-dns.com/dns-query?name=${host}&type=HTTPS`;
    const res = await fetch(url, {
      headers: { Accept: "application/dns-json" },
      signal: AbortSignal.timeout(5_000),
    });
    const data = await res.json() as { Answer?: Array<{ type: number; data: string }> };
    const httpsRecords = (data.Answer ?? []).filter((a) => a.type === 65);
    if (httpsRecords.length === 0) return { found: false, records: [] };

    const records = httpsRecords.map((a) => a.data);
    const combined = records.join(" ");
    const echMatch = combined.match(/ech="([A-Za-z0-9+/=]+)"/);

    return {
      found: true,
      records,
      echParam: echMatch?.[1],
    };
  } catch {
    return { found: false, records: [] };
  }
}

// Deep TLS handshake analysis
function probeTls(host: string, port: number): Promise<{
  tlsVersion?: string;
  cipher?: string;
  alpn?: string[];
  certSubject?: string;
  certIssuer?: string;
  connected: boolean;
  error?: string;
}> {
  return new Promise((resolve) => {
    let resolved = false;

    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
        ALPNProtocols: ["h2", "http/1.1"],
        // Request ECH by setting the servername to the public name from ECH config
        // Node.js doesn't natively support ECH, but we can observe server behavior
      },
      () => {
        if (resolved) return;
        resolved = true;
        const cert = socket.getPeerCertificate();
        const proto = socket.getProtocol();
        const cipher = socket.getCipher();
        const alpn = socket.alpnProtocol;

        socket.destroy();
        resolve({
          tlsVersion: proto ?? undefined,
          cipher: cipher ? `${cipher.name} (${cipher.version})` : undefined,
          alpn: alpn ? [alpn] : undefined,
          certSubject: String(cert?.subject?.CN ?? ""),
          certIssuer: String(cert?.issuer?.O ?? ""),
          connected: true,
        });
      }
    );

    socket.on("error", (err) => {
      if (resolved) return;
      resolved = true;
      resolve({ connected: false, error: err.message });
    });

    socket.setTimeout(8_000, () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({ connected: false, error: "Connection timed out" });
    });
  });
}

// Connect with servername mismatch to test ECH outer/inner SNI behavior
function probeEchSni(host: string, port: number): Promise<{ outerSniAccepted: boolean; error?: string }> {
  return new Promise((resolve) => {
    let resolved = false;

    // Connect using a random fake SNI — if server still serves a valid cert,
    // it likely supports ECH (decrypting the inner SNI)
    const fakeSni = `test-${Date.now()}.example.com`;

    const socket = tls.connect(
      {
        host,
        port,
        servername: fakeSni,
        rejectUnauthorized: false,
        ALPNProtocols: ["h2"],
      },
      () => {
        if (resolved) return;
        resolved = true;
        const cert = socket.getPeerCertificate();
        const subjectCn = String(cert?.subject?.CN ?? "");
        socket.destroy();

        // If the server returned a cert matching the real host (not the fake SNI),
        // it means it decrypted an ECH inner SNI or fell back to the real name
        const matched = subjectCn === host || subjectCn.includes(host.replace(/\./g, ""));
        resolve({ outerSniAccepted: matched });
      }
    );

    socket.on("error", () => {
      if (resolved) return;
      resolved = true;
      resolve({ outerSniAccepted: false, error: "Connection rejected with fake SNI" });
    });

    socket.setTimeout(5_000, () => {
      if (resolved) return;
      resolved = true;
      socket.destroy();
      resolve({ outerSniAccepted: false, error: "Timed out" });
    });
  });
}

export async function probeEch(host: string, port = 443): Promise<EchProbeResult> {
  const details: EchProbeResult["details"] = [];

  // 1. DNS HTTPS record
  const dns = await fetchDnsHttps(host);
  if (dns.found) {
    details.push({
      check: "DNS HTTPS Record",
      status: "pass",
      message: `Found ${dns.records.length} HTTPS record(s)`,
    });
  } else {
    details.push({
      check: "DNS HTTPS Record",
      status: "fail",
      message: "No DNS HTTPS/SVCB record found — ECH requires DNS HTTPS records",
    });
  }

  // 2. ECH config in DNS
  const echConfigPresent = !!dns.echParam;
  if (echConfigPresent) {
    details.push({
      check: "ECH Configuration",
      status: "pass",
      message: "ECH config payload found in DNS HTTPS record",
    });
  } else if (dns.found) {
    details.push({
      check: "ECH Configuration",
      status: "warn",
      message: "HTTPS record exists but no ech= parameter — server may not support ECH",
    });
  } else {
    details.push({
      check: "ECH Configuration",
      status: "fail",
      message: "No ECH configuration published",
    });
  }

  // 3. TLS handshake
  const tlsResult = await probeTls(host, port);
  if (tlsResult.connected) {
    details.push({
      check: "TLS Handshake",
      status: "pass",
      message: `Connected: ${tlsResult.tlsVersion}, ${tlsResult.cipher}`,
    });
    if (tlsResult.tlsVersion?.includes("1.3")) {
      details.push({ check: "TLS 1.3", status: "pass", message: "TLS 1.3 supported (required for ECH)" });
    } else {
      details.push({ check: "TLS 1.3", status: "fail", message: `Using ${tlsResult.tlsVersion} — ECH requires TLS 1.3` });
    }
  } else {
    details.push({
      check: "TLS Handshake",
      status: "fail",
      message: `Connection failed: ${tlsResult.error}`,
    });
  }

  // 4. SNI probe — connect with fake SNI to test ECH inner/outer SNI
  const sniResult = await probeEchSni(host, port);
  if (sniResult.outerSniAccepted) {
    details.push({
      check: "ECH SNI Probe",
      status: "pass",
      message: "Server accepted connection with mismatched SNI — indicates ECH decryption or fallback",
    });
  } else {
    details.push({
      check: "ECH SNI Probe",
      status: "info",
      message: sniResult.error || "Server rejected mismatched SNI — normal behavior without ECH",
    });
  }

  // 5. Certificate match
  const certMatch = tlsResult.connected && tlsResult.certSubject === host;
  if (certMatch) {
    details.push({
      check: "Certificate Match",
      status: "pass",
      message: `Certificate CN matches ${host}`,
    });
  } else if (tlsResult.connected) {
    details.push({
      check: "Certificate Match",
      status: "warn",
      message: `Certificate CN "${tlsResult.certSubject}" does not match ${host}`,
    });
  }

  // Grade
  let grade: EchProbeResult["grade"] = "F";
  const passCount = details.filter((d) => d.status === "pass").length;
  const failCount = details.filter((d) => d.status === "fail").length;

  if (echConfigPresent && tlsResult.tlsVersion?.includes("1.3") && sniResult.outerSniAccepted) {
    grade = "A+";
  } else if (echConfigPresent && tlsResult.tlsVersion?.includes("1.3")) {
    grade = "A";
  } else if (echConfigPresent && tlsResult.connected) {
    grade = "B";
  } else if (dns.found && tlsResult.connected) {
    grade = "C";
  } else if (tlsResult.connected) {
    grade = "D";
  }

  return {
    host,
    port,
    dnsHttpsRecord: dns.found,
    echConfigPresent,
    echConfigPayload: dns.echParam,
    tlsVersion: tlsResult.tlsVersion,
    cipherSuite: tlsResult.cipher,
    alpnProtocols: tlsResult.alpn,
    certificateMatch: certMatch,
    serverNameIndication: tlsResult.connected,
    grade,
    details,
  };
}
