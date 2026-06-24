import { Hono } from "hono";
import { checkTls } from "../services/tls-check.js";
import { z } from "zod";

export const tlsRoutes = new Hono();

const hostSchema = z.object({
  host: z.string().min(1).max(255).regex(/^[a-zA-Z0-9.-]+$/),
  port: z.coerce.number().int().min(1).max(65535).optional().default(443),
});

tlsRoutes.get("/check", async (c) => {
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
    const result = await checkTls(parsed.data.host, parsed.data.port);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "TLS check failed", timestamp: new Date().toISOString() }, 502);
  }
});
