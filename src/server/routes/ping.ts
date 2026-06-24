import { Hono } from "hono";
import { z } from "zod";
import { pingHost, tracerouteHost } from "../services/ping.js";

export const pingRoutes = new Hono();

const HOST_REGEX = /^[a-zA-Z0-9.\-_:]+$/;

const pingSchema = z.object({
  host: z.string().min(1).max(255).regex(HOST_REGEX, "Invalid host characters"),
  count: z.coerce.number().int().min(1).max(20).optional().default(4),
});

const tracerouteSchema = z.object({
  host: z.string().min(1).max(255).regex(HOST_REGEX, "Invalid host characters"),
  maxHops: z.coerce.number().int().min(1).max(30).optional().default(20),
});

pingRoutes.get("/ping", async (c) => {
  const host = c.req.query("host");
  const count = c.req.query("count");

  const parsed = pingSchema.safeParse({ host, count });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid host or count", timestamp: new Date().toISOString() },
      400
    );
  }

  try {
    const result = await pingHost(parsed.data.host, parsed.data.count);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "Ping failed", timestamp: new Date().toISOString() }, 502);
  }
});

pingRoutes.get("/traceroute", async (c) => {
  const host = c.req.query("host");
  const maxHops = c.req.query("maxHops");

  const parsed = tracerouteSchema.safeParse({ host, maxHops });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid host or maxHops", timestamp: new Date().toISOString() },
      400
    );
  }

  try {
    const result = await tracerouteHost(parsed.data.host, parsed.data.maxHops);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "Traceroute failed", timestamp: new Date().toISOString() }, 502);
  }
});
