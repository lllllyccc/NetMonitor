import { Hono } from "hono";
import { checkDnsLeak } from "../services/dns-leak.js";

export const dnsRoutes = new Hono();

dnsRoutes.get("/leak-test", async (c) => {
  try {
    const result = await Promise.race([
      checkDnsLeak(),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("DNS leak test timed out")), 15_000)),
    ]);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "DNS leak test failed";
    return c.json({ success: false, error: msg, timestamp: new Date().toISOString() }, 502);
  }
});
