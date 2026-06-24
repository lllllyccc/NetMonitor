import { Hono } from "hono";
import { measureLatency, generatePayload, calculateSpeed, runSpeedTest } from "../services/speed-test.js";
import { z } from "zod";

export const speedtestRoutes = new Hono();

const downloadSchema = z.object({
  sizeMB: z.coerce.number().min(1).max(25).optional().default(10),
});

// Measure latency (ping)
speedtestRoutes.get("/latency", async (c) => {
  try {
    const result = await measureLatency();
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "Latency measurement failed", timestamp: new Date().toISOString() }, 502);
  }
});

// Download test - generates random payload for client to download
speedtestRoutes.get("/download", async (c) => {
  const sizeMB = parseFloat(c.req.query("sizeMB") || "10");
  const parsed = downloadSchema.safeParse({ sizeMB });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid size (1-25 MB)", timestamp: new Date().toISOString() },
      400
    );
  }

  const actualMB = Math.min(parsed.data.sizeMB, parseInt(process.env.MAX_SPEEDTEST_SIZE_MB || "25", 10));
  const payload = generatePayload(actualMB * 1024 * 1024);

  return new Response(new Uint8Array(payload), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Length": String(payload.length),
      "Cache-Control": "no-store",
    },
  });
});

// Upload test - accepts data and returns timing info
speedtestRoutes.post("/upload", async (c) => {
  const maxBytes = parseInt(process.env.MAX_SPEEDTEST_SIZE_MB || "25", 10) * 1024 * 1024;
  const contentLength = parseInt(c.req.header("content-length") || "0", 10);
  if (contentLength > maxBytes) {
    return c.json(
      { success: false, error: "Upload too large (max 25 MB)", timestamp: new Date().toISOString() },
      413
    );
  }
  const start = performance.now();
  const body = await c.req.arrayBuffer();
  const durationMs = performance.now() - start;
  const bytesReceived = body.byteLength;
  const mbps = calculateSpeed(bytesReceived, durationMs);

  return c.json({
    success: true,
    data: {
      bytesReceived,
      durationMs: Math.round(durationMs * 100) / 100,
      uploadMbps: mbps,
    },
    timestamp: new Date().toISOString(),
  });
});

// Run full server-side speed test (latency only; download/upload measured client-side)
speedtestRoutes.get("/run", async (c) => {
  try {
    const result = await runSpeedTest();
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "Speed test failed", timestamp: new Date().toISOString() }, 502);
  }
});
