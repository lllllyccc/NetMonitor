import { Hono } from "hono";
import { checkEch } from "../services/ech-check.js";
import { probeEch } from "../services/ech-probe.js";
import { z } from "zod";

export const echRoutes = new Hono();

const hostSchema = z.object({
  host: z.string().min(1).max(255).regex(/^[a-zA-Z0-9.-]+$/),
  port: z.coerce.number().int().min(1).max(65535).optional().default(443),
});

echRoutes.get("/check", async (c) => {
  const host = c.req.query("host");
  const port = c.req.query("port");

  const parsed = hostSchema.safeParse({ host, port });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid host or port", timestamp: new Date().toISOString() },
      400
    );
  }

  try {
    const result = await checkEch(parsed.data.host, parsed.data.port);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "ECH check failed", timestamp: new Date().toISOString() }, 502);
  }
});

echRoutes.get("/probe", async (c) => {
  const host = c.req.query("host");
  const port = c.req.query("port");

  const parsed = hostSchema.safeParse({ host, port });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid host or port", timestamp: new Date().toISOString() },
      400
    );
  }

  try {
    const result = await Promise.race([
      probeEch(parsed.data.host, parsed.data.port),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("ECH probe timed out")), 20_000)),
    ]);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "ECH probe failed";
    return c.json({ success: false, error: msg, timestamp: new Date().toISOString() }, 502);
  }
});

// Client-side probe: returns TLS metadata about the incoming connection
// In production behind Nginx, TLS info comes via proxy headers
echRoutes.get("/client-probe", (c) => {
  const proto = c.req.header("x-forwarded-proto") || "http";
  const sslProtocol = c.req.header("ssl_protocol") || "";
  const sslCipher = c.req.header("ssl_cipher") || "";
  const alpn = c.req.header("ssl_alpn") || "";

  const isTls13 = sslProtocol.includes("1.3") || proto === "https";

  return c.json({
    success: true,
    data: {
      tlsVersion: sslProtocol || (proto === "https" ? "TLS (version unknown — Nginx did not forward ssl_protocol)" : "none (HTTP)"),
      cipher: sslCipher || undefined,
      alpn: alpn || undefined,
      forwardedProto: proto,
      isSecure: proto === "https",
      tls13Likely: isTls13,
    },
    timestamp: new Date().toISOString(),
  });
});