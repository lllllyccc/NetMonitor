import { Hono } from "hono";
import { lookupIp } from "../services/ip-lookup.js";
import { z } from "zod";

export const ipRoutes = new Hono();

const lookupSchema = z.object({
  target: z.string().min(1).max(255).regex(
    /^[\d.:a-fA-F]+$|^[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]*[a-zA-Z0-9])?)*$/,
    "Invalid target: only IP addresses or domain names allowed"
  ).optional(),
});

ipRoutes.get("/lookup", async (c) => {
  const target = c.req.query("target") || undefined;

  const parsed = lookupSchema.safeParse({ target });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid target", timestamp: new Date().toISOString() },
      400
    );
  }

  try {
    const result = await lookupIp(target);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "IP lookup failed", timestamp: new Date().toISOString() }, 502);
  }
});
