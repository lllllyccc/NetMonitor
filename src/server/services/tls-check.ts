import tls from "node:tls";
import crypto from "node:crypto";
import type { TlsCheckResult } from "../../shared/types.js";

export async function checkTls(host: string, port = 443): Promise<TlsCheckResult> {
  return new Promise((resolve, reject) => {
    const issues: string[] = [];
    const socket = tls.connect(
      {
        host,
        port,
        servername: host,
        rejectUnauthorized: false,
      },
      () => {
        const cert = socket.getPeerCertificate();
        const proto = socket.getProtocol();
        const cipher = socket.getCipher();

        if (!cert || !cert.valid_from) {
          socket.destroy();
          reject(new Error("No certificate returned"));
          return;
        }

        const validTo = new Date(cert.valid_to);
        const validFrom = new Date(cert.valid_from);
        const now = new Date();
        const daysRemaining = Math.floor(
          (validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Evaluate issues
        if (daysRemaining < 0) {
          issues.push("Certificate has expired");
        } else if (daysRemaining < 30) {
          issues.push(`Certificate expires in ${daysRemaining} days`);
        }

        if (!proto || !proto.includes("TLSv1.3")) {
          if (proto && proto.includes("TLSv1.2")) {
            issues.push("TLS 1.2 supported but TLS 1.3 not detected");
          } else {
            issues.push(`Outdated protocol: ${proto}`);
          }
        }

        // Check if self-signed
        if (cert.subject && cert.issuer) {
          const subjectStr = JSON.stringify(cert.subject);
          const issuerStr = JSON.stringify(cert.issuer);
          if (subjectStr === issuerStr) {
            issues.push("Certificate appears to be self-signed");
          }
        }

        // Calculate grade
        let grade: TlsCheckResult["grade"] = "A+";
        if (daysRemaining < 0) grade = "F";
        else if (issues.length >= 3) grade = "C";
        else if (issues.length === 2) grade = "B";
        else if (issues.length === 1 && !proto?.includes("TLSv1.3")) grade = "B";
        else if (issues.length === 1) grade = "A";

        // OCSP stapling - check via raw socket extension (simplified check)
        const ocspStapling = false; // Full detection requires openssl s_client

        const result: TlsCheckResult = {
          host,
          port,
          protocol: proto || "unknown",
          cipher: cipher ? `${cipher.name} (${cipher.version})` : "unknown",
          certificate: {
            subject: String(cert.subject?.CN || host),
            issuer: String(cert.issuer?.O || cert.issuer?.CN || "unknown"),
            validFrom: validFrom.toISOString(),
            validTo: validTo.toISOString(),
            daysRemaining,
            serialNumber: String(cert.serialNumber || ""),
            fingerprint: String(cert.fingerprint256 || cert.fingerprint || ""),
          },
          ocspStapling,
          grade,
          issues,
        };

        socket.destroy();
        resolve(result);
      }
    );

    socket.on("error", (err) => {
      reject(new Error(`TLS connection failed: ${err.message}`));
    });

    socket.setTimeout(10_000, () => {
      socket.destroy();
      reject(new Error("TLS connection timed out"));
    });
  });
}
