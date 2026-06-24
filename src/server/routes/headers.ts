import { Hono } from "hono";
import { checkHeaders } from "../services/header-check.js";
import { z } from "zod";

export const headerRoutes = new Hono();

const urlSchema = z.object({
  url: z.string().min(1).max(2048).regex(
    /^https?:\/\/.+/i,
    "Invalid URL: must start with http:// or https://"
  ),
});

headerRoutes.get("/check", async (c) => {
  const url = c.req.query("url");

  const parsed = urlSchema.safeParse({ url });
  if (!parsed.success) {
    return c.json(
      { success: false, error: "Invalid URL", timestamp: new Date().toISOString() },
      400
    );
  }

  try {
    const result = await checkHeaders(parsed.data.url);
    return c.json({ success: true, data: result, timestamp: new Date().toISOString() });
  } catch {
    return c.json({ success: false, error: "Header check failed", timestamp: new Date().toISOString() }, 502);
  }
});
